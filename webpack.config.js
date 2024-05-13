const path = require("path");
const fs = require('fs');

function mix(files_in_order, savePath) {
    var mergedContent = '';

    for (let filename of files_in_order) {
        let contentA = fs.readFileSync(filename, 'utf8');
        mergedContent = mergedContent + contentA + '\n\n';
    }

    fs.writeFileSync(savePath, mergedContent, 'utf8');

}

const tempMixedFilename = './src/popup/tempMixed.js';

module.exports = {
  entry: { main: ['./src/popup/webdav.js', tempMixedFilename]},
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "popup"),
  },
  mode: "production",
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.beforeRun.tap('MyMixPlugin', () => {
          console.log('This is executed before bundling');
          const files_in_order = ['./src/popup/sprites_data.js', './src/popup/sync.js', './src/popup/archive.js'];
          mix(files_in_order, tempMixedFilename);
        });
        compiler.hooks.done.tap('MyCleanPlugin', () => {
          console.log('This is executed when build completed');
          fs.rmSync(tempMixedFilename);
        });
      },
    },
  ],
};
