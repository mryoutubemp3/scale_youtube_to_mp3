const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3033;

app.use(express.json());
app.use(express.static('public'));
app.use('/downloads', express.static(path.join(__dirname,'downloads')));

//////////////////////////////////////////////////////////
// 🔥 GET VIDEO INFO (THIS FIXES YOUR THUMBNAIL ISSUE)
//////////////////////////////////////////////////////////
app.post('/info',(req,res)=>{
  const { url } = req.body;

  const ytdlp = spawn('yt-dlp',[
    url,
    '--dump-json'
  ]);

  let data = '';

  ytdlp.stdout.on('data',chunk=>{
    data += chunk.toString();
  });

  ytdlp.on('close',()=>{
    try{
      const json = JSON.parse(data);

      res.json({
        title: json.title,
        thumbnail: json.thumbnail,
        duration: json.duration
      });

    }catch(e){
      res.status(500).json({error:'Invalid video'});
    }
  });
});

//////////////////////////////////////////////////////////
// 🔥 CONVERT (PARALLEL SAFE)
//////////////////////////////////////////////////////////
app.post('/convert',(req,res)=>{
  const { url, bitrate } = req.body;

  const output = path.join(__dirname,'downloads','%(title)s.%(ext)s');

  const ytdlp = spawn('yt-dlp',[
    url,
    '--extract-audio',
    '--audio-format','mp3',
    '--audio-quality', bitrate || '192K',
    '--output', output,
    '--restrict-filenames'
  ]);

  let filename = null;

  ytdlp.stdout.on('data',(d)=>{
    const line = d.toString();

    const match = line.match(/Destination:\s*(.*)/);
    if(match){
      filename = path.basename(match[1]);
    }

    console.log(line);
  });

  ytdlp.on('close',(code)=>{
    if(code===0){
      res.json({
        filePath:`/downloads/${filename}`
      });
    }else{
      res.status(500).json({error:'fail'});
    }
  });
});

app.listen(PORT,()=>{
  console.log("Running http://localhost:"+PORT);
});
