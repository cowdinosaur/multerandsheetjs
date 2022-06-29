/* xlsx.js (C) 2013-present  SheetJS -- http://sheetjs.com */
const fs = require('fs'), path = require('path'), URL = require('url');
const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

const express = require('express'), app = express();
var data = "a,b,c\n1,2,3".split("\n").map(function(x) { return x.split(","); });
const XLSX = require('xlsx');

/* helper to generate the workbook object */
function make_book() {
	var ws = XLSX.utils.aoa_to_sheet(data);
	var wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
	return wb;
}

function get_data(req, res, type) {
	var wb = make_book();
	/* send buffer back */
	res.status(200).send(XLSX.write(wb, {type:'buffer', bookType:type}));
}

function get_file(req, res, file) {
	var wb = make_book();
	/* write using XLSX.writeFile */
	XLSX.writeFile(wb, file);
	res.status(200).send("wrote to " + file + "\n");
}

function load_data(file) {
	var wb = XLSX.readFile(file);
	/* generate array of arrays */
	data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
	console.log(data);
}

function post_data(req, res) {
	var keys = Object.keys(req.files), k = keys[0];
	load_data(req.files[k].path);
	res.status(200).send("ok\n");
}

function post_file(req, res, file) {
	load_data(file);
	res.status(200).send("ok\n");
}
app.get('/', function(req, res, next) {
	var url = URL.parse(req.url, true);
	if(url.query.t) return get_data(req, res, url.query.t);
  else if(url.query.f) return get_file(req, res, url.query.f);
  res.sendFile(path.join(__dirname, '/index.html'));
});
app.post('/', function(req, res, next) {
	var url = URL.parse(req.url, true);
	if(url.query.f) return post_file(req, res, url.query.f);
	return post_data(req, res);
});

app.get('/stats', function(req, res, next) {
	var url = URL.parse(req.url, true);
  res.sendFile(path.join(__dirname, '/submission.html'));
});

app.post('/stats', upload.array('uploaded_file', 12), function (req, res) {
   // req.file is the name of your file in the form above, here 'uploaded_file'
   // req.body will hold the text fields, if there were any

   console.log(req.files, req.body);
   res.status(200).end()
});


var port = +process.argv[2] || +process.env.PORT || 7262;
app.listen(port, function() { console.log('Serving HTTP on port ' + port); });
