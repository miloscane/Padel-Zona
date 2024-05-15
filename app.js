//Server
const server			=	require('express')();
const http				=	require('http').Server(server);
const express			=	require('express');
const fs 				=	require('fs');
const bodyParser		=	require('body-parser');
const nodemailer		=	require('nodemailer');
const dotenv 			=	require('dotenv');
const crypto			=	require('node:crypto');
dotenv.config();

server.set('view engine','ejs');
var viewArray	=	[__dirname+'/views'];
var viewFolder	=	fs.readdirSync('views');
for(var i=0;i<viewFolder.length;i++){
	if(viewFolder[i].split(".").length==1){
		viewArray.push(__dirname+'/'+viewFolder[i])
	}
}
server.set('views', viewArray);
server.use(express.static(__dirname + '/public'));
server.use(bodyParser.json({limit:'50mb'}));  
server.use(bodyParser.urlencoded({ limit:'50mb',extended: true }));

/*var transporter = nodemailer.createTransport({
	host: process.env.transporterhost,
	port: 465,
	secure: true,
	auth: {
		user: process.env.transporteruser,
		pass: process.env.transporterpass
	}
});*/

http.listen(process.env.PORT, function(){
	console.log("Padel Zona Website");
	console.log("Server Started");
});

server.get('/',async (req,res)=>{
	res.render("home",{});
});

server.get('/o-nama',async (req,res)=>{
	res.render("onama",{});
});

server.get('/pravila',async (req,res)=>{
	res.render("pravila",{});
});

server.get('/vesti',async (req,res)=>{
	res.render("vesti",{});
});

server.get('/cenovnik',async (req,res)=>{
	res.render("cenovnik",{});
});

server.get('/galerija',async (req,res)=>{
	res.render("galerija",{});
});

server.get('/vesti/vest',async (req,res)=>{
	res.render("vest",{});
});





