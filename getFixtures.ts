import unzipper from 'unzipper';
import fetch from 'node-fetch-commonjs';
import fs from 'fs';
import path from 'path';

const fixtures = [{
  fixturesDir: './__tests__/search/__fixtures__',
  codeLink: 'https://github.com/callstack/react-native-paper/archive/abf631a4d595831fcd12be03008be059bb5aeeec.zip',
  codePath: 'example/src'
}]

const downloadFile = (async (url: string, path: string) => {
  // const fetch = await import('node-fetch').then(mod => mod.default)
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
    res?.body?.pipe(fileStream);
    res?.body?.on("error", reject);
    fileStream.on("finish", resolve);
  });
});


const processCodeZip = (zipPath: string, codePath: string, fixturesDir: string) => {
  let copied = false
  fs.createReadStream(zipPath)
    .pipe(unzipper.Parse())
    .on('entry', function (entry) {
      const fileName = entry.path as string;
      const type = entry.type; // 'Directory' or 'File'
      const cleanPath = fileName.split('/').slice(1).join('/')

      if (cleanPath.includes(codePath)) {
        console.log(cleanPath)
        copied = true
        const targetPath = path.join(fixturesDir, cleanPath.replace(codePath, ''))
        console.log(targetPath)
        try {

          if (type === 'Directory') {
            fs.mkdirSync(targetPath)
          }
          else {
            entry.pipe(fs.createWriteStream(targetPath));
          }
        }
        catch (e) {
          console.error(e)
        }
      } else {
        entry.autodrain();
      }
    });
}

(async () => {

  const fixture = fixtures[0]
  const tempZipFileName = `${Date.now()}.zip`

  await downloadFile(fixture.codeLink, tempZipFileName)

  processCodeZip(tempZipFileName, fixture.codePath, fixture.fixturesDir)

  fs.unlinkSync(tempZipFileName)

})()