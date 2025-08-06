//Server
const server			=	require('express')();
const http				=	require('http').Server(server);
const express			=	require('express');
const fs 				=	require('fs');
const bodyParser		=	require('body-parser');
const nodemailer		=	require('nodemailer');
const dotenv 			=	require('dotenv');
const crypto			=	require('node:crypto');
const session			=	require('express-session');
const cookieParser		=	require('cookie-parser');
const {MongoClient}		=	require('mongodb');
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
server.use(cookieParser());
server.use(session({
	secret: process.env.sessionsecret,
    resave: true,
    saveUninitialized: true
}));
const mongourl	=	process.env.mongourl;
const client 	= 	new MongoClient(mongourl,{});
var rezervacijeDB;

var bucket = process.env.bucket ? process.env.bucket : ""

function getDateAsStringForDisplay(date){
	var yearString	=	date.getFullYear();
	var month		=	eval(date.getMonth()+1);
	var monthString	=	(month<10) ? "0" + month : month;
	var day			=	date.getDate();
	var dayString	=	(day<10) ? "0" + day : day;
	return	dayString+"."+monthString+"."+yearString;
}

function generateId(length) {
	var result           = [];
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i =0 ; i < length; i++ ) {
		result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
	}
	return result.join('');
}

function getMonday(d) {
	d = new Date(d);
	var day = d.getDay(),
	diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
	return new Date(d.setDate(diff));
}

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
	var dbConnectionStart	=	new Date().getTime();
	client.connect()
	.then(() => {
		console.log("Connected to database in " + eval(new Date().getTime()/1000-dbConnectionStart/1000).toFixed(2)+"s")
		rezervacijeDB	=	client.db("PadelZona").collection('rezervacije');
	})
	.catch((error)=>{
		console.log(error);
	})
});

server.get('/',async (req,res)=>{
	res.render("home",{
		bucket: bucket
	});
});

server.get('/o-nama',async (req,res)=>{
	res.render("onama",{
		bucket: bucket
	});
});

server.get('/pravila',async (req,res)=>{
	res.render("pravila",{
		bucket: bucket
	});
});

server.get('/vesti',async (req,res)=>{
	if(req.session.user){
		res.render("adminVesti",{
		bucket: bucket
	})
	}else{
		res.render("vesti",{
		bucket: bucket
	});
	}
});

server.get('/cenovnik',async (req,res)=>{
	res.render("cenovnik",{
		bucket: bucket
	});
});

server.get('/galerija',async (req,res)=>{
	res.render("galerija",{
		bucket: bucket
	});
});

server.get('/vesti/vest',async (req,res)=>{
	res.render("vest",{
		bucket: bucket
	});
});

server.get('/login',async (req,res)=>{
	if(req.session.user){
		res.redirect("/administracija")
	}else{
		res.render("login",{
			bucket: bucket
		});
	}
	
});

server.post('/login',async (req,res)=>{
	if(req.session.user){
		res.redirect("/administracija")
	}else{
		if(req.body.email==process.env.loginuser && req.body.password==process.env.loginpass){
			req.session.user	=	"Admin";
			res.redirect("/administracija")
		}else{
			res.send("Pogresno ukucano");
		}
	}
});

server.get('/administracija',async (req,res)=>{
	if(req.session.user){
		var today = new Date();
		var monday = getMonday(today);
		monday.setHours(0,0,0,0);
		rezervacijeDB.find({datetime:{$gte:monday.getTime()}}).toArray()
		.then((rezervacije)=>{
			res.render("administracija",{
				today: today.getTime(),
				bucket: bucket,
				rezervacije: rezervacije
			});	
		})
		.catch((error)=>{
			console.log(error);
			res.send("Greska u bazi podataka 146")
		})
		
	}else{
		res.redirect("/login")
	}
});

server.post('/newBooking',async (req,res)=>{
	if(req.session.user){
		var json = JSON.parse(req.body.json);
		json.datetime = Number(json.datetime);
		json.datum = getDateAsStringForDisplay(new Date(Number(json.datetime)));
		json.uniqueId = generateId(10)+"--"+new Date().getTime();
		rezervacijeDB.find({datum:json.datum,court:json.court,time:json.time}).toArray()
		.then((rezervacije)=>{
			if(rezervacije==0){
				rezervacijeDB.insertOne(json)
				.then((dbResponse)=>{
					res.render("potvrdaRezervacijeAdmin",{
						rezervacija:json
					});
				})
				.catch((error)=>{
					console.log(error);
					res.send("Greska u bazi podataka 156")
				})		
			}else{
				res.send("Termin je vec zakazan")
			}
		})
		.catch((error)=>{
			console.log(error);
			res.send("Greska u bazi podataka 131")
		})
	}else{
		res.redirect("/")
	}
});

server.post('/deleteBooking',async (req,res)=>{
	if(req.session.user){
		var id = req.body.id;
		rezervacijeDB.deleteOne({uniqueId:id})
		.then((dbResponse)=>{
			res.render("potvrdaOtkazivanjaAdmin",{});
		})
		.catch((error)=>{
			console.log(error);
			res.send("Greska u bazi podataka 131")
		})
	}else{
		res.redirect("/")
	}
}); 





