export const enum ReportFormat {
  PDF = "PDF",
  CSV = "CSV",
  XML = "XML",
  Word = "Word",
  Excel = "Excel",
  HTML5 = "HTML 5"
}

export interface ReportConfig {
  id: string;
  sessionId?: string;
  controlId?: string;
  reportId: string;
  format: ReportFormat;
  parameterName: string;
  table: string;
}

const getReportFilter = async (config: ReportConfig): Promise<string> => {
  const metadata = await Xrm.Utility.getEntityMetadata(config.table);

  return [
    '<ReportFilter>',
    `<ReportEntity paramname="${config.parameterName}" donotconvert="1">`,
    '<fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false">',
    `<entity name="${metadata.LogicalName}">`,
    '<all-attributes />',
    '<filter type="and">',
    `<condition attribute="${metadata.PrimaryIdAttribute}" operator="eq" value="${config.id}" />`,
    '</filter>',
    '</entity>',
    '</fetch>',
    '</ReportEntity>',
    '</ReportFilter>'
  ].join('');
};

const getReportSession = async (report: Record<string, string>, config: ReportConfig): Promise<ReportConfig> => {
  const url = `${Xrm.Utility.getGlobalContext().getClientUrl()}/CRMReports/rsviewer/reportviewer.aspx`;

  const filter = await getReportFilter(config);

  const body = [
    `id=%7B${config.reportId}%7D&`,
    `uniquename=${Xrm.Utility.getGlobalContext().organizationSettings.uniqueName}&`,
    `iscustomreport=true&`,
    `reportnameonsrs=&`,
    `reportName=${report.name}&`,
    'isScheduledReport=false&',
    `CRM_Filter=${filter}`
  ].join('');

  const options: RequestInit = {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': '*/*'
    }
  };

  const res = await fetch(url, options);
  const result = await res.text();

  const sessionIndex = result.lastIndexOf('ReportSession=');
  const controlIndex = result.lastIndexOf('ControlID=');

  if (sessionIndex === -1 || controlIndex === -1) {
    throw new Error('Failed to retrieve report session and control id');
  }

  config.sessionId = result.substring(sessionIndex + 14, sessionIndex + 14 + 24);
  config.controlId = result.substring(controlIndex + 10, controlIndex + 10 + 32);

  return config;
};

const convertBlobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader;
  reader.onerror = reject;
  reader.onload = () => {
    resolve(reader.result as string);
  };

  reader.readAsDataURL(blob);
});

export const generateReport = async (config: ReportConfig): Promise<string> => {
  const report = await Xrm.WebApi.retrieveRecord('report', config.reportId, '?$select=iscustomreport,reportnameonsrs,languagecode,name');

  config = await getReportSession(report, config);

  const url = `${Xrm.Utility.getGlobalContext().getClientUrl()}/Reserved.ReportViewerWebControl.axd`;

  const query = [
    'OpType=Export&',
    `Format=${config.format}&`,
    'ContentDisposition=AlwaysAttachment&',
    'FileName=&',
    `Culture=${report.languagecode}&`,
    'CultureOverrides=False&',
    `UICulture=${report.languagecode}&`,
    'UICultureOverrides=False&',
    `ReportSession=${config.sessionId}&`,
    `ControlID=${config.controlId}`
  ].join('');

  const options: RequestInit = {
    method: 'GET'
  };

  const res = await fetch(`${url}?${query}`, options);
  const blob = await res.blob();

  const reportFile = await convertBlobToBase64(blob);

  return reportFile.split('base64,')[1];
}
