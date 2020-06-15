import https from 'https';

export const getNugetPackageVersions = (name: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    https.get(`https://api-v2v3search-0.nuget.org/query?q=packageid:${name}`,
      (response) => {
        let body = '';

        response.on('data', (d) => {
          body += d;
        });

        response.on('end', () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const versions = JSON.parse(body).data[0].versions.map((v: any) => {
            return v.version;
          }).reverse();

          resolve(versions);
        });
      }
    ).on('error', (e) => {
      reject(e);
    });
  });
}
