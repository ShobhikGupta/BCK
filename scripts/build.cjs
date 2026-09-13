const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root)){
  if(/\.(html|css|js|svg|ico|txt)$/.test(name)&&fs.statSync(path.join(root,name)).isFile())fs.copyFileSync(path.join(root,name),path.join(out,name));
}
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
console.log('Static site built in dist; database and test tooling excluded.');
