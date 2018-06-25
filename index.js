var express = require('express');
var app = express();
const path = require('path');
const publicPath = path.join(__dirname,'..','/public'); 
const admin = require("firebase-admin");
//var functions = require("firebase-functions");
//var firebase = require('firebase');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session')
var serviceAccount = require('./secret.json');
admin.initializeApp( {
	credential: admin.credential.cert(serviceAccount)
})
app.use(cookieSession({
    
    keys: ['This is a secret'],
   
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }))
var port = 8000;

var db = admin.firestore();
/*var messageRoutes = require('./routes/message.js')(express, admin, (router) => {
	app.use(router);
});*/
//app.use(messageRoutes.router);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.set('view engine', 'ejs');

app.get('/', (req,res)=>{
    res.sendfile('index.html');
})

/*app.get("/hi", (req, res) => {

  res.send("hello");
    db.collection('hi').doc('hi').set({
        hi : true
    })
});*/

app.post("/login", (req,res)=>{
    var roll = req.body.roll;
    var pass = req.body.pass;
    req.session.courseType = 0;
    db.collection('users').where("roll", "==", req.body.roll).get()
    .then((data) =>{
        data.forEach((data)=>{
        console.log(data.data());
        console.log(req.body.roll + " " + req.body.pass);
        console.log(req.body.pass == data.data().pass && req.body.roll == data.data().roll)
        if(req.body.pass == data.data().pass && req.body.roll == data.data().roll){
                req.session.type = Number(data.data().type);
                console.log(req.session.type)
                req.session.roll = roll;
                res.redirect('/home');
            }
        else{
                res.send("Your username or password was wrong click <a href='/'>here</a> to go back to the login page.");
            }
        })
    })
    .catch((err) =>{
        console.log(err);
        res.send("Your username or password was wrong click <a href='/'>here</a> to go back to the login page.");
    })
})

app.get('/home', (req,res)=>{
    courses = [];
    console.log(req.session.roll);
    if(req.session.roll){
        db.collection('courses').get().then((data)=>{
            data.forEach(doc =>{
                courses.push(doc.data());

            })
            setTimeout(() => {
            res.render('home.ejs', {result:req.session, res1:courses})
            }, 4000);
            
        })
        
    }
    else{
        res.send("You haven't logged in yet, click <a href='/'>here</a> to go back to the login page.");
    }
})

//teacher module

app.get('/teacherSelect', (req,res)=>{
    id = req.query.teacher;
    var list = [];
    var i = Number(0);
    db.collection('courses').doc(id).get().then((data)=>{
        res.render('students.ejs',{result:req.session, res1:data.data().users});  
    })
    
})


//student module
app.get('/enroll', (req,res)=>{
    
    if(req.session.courseType == 0){
        var obj = [];
        course = db.collection('courses').get()
        .then(snapshot =>{
        snapshot.forEach(doc =>{
            obj.push(doc.data());
            //console.log(doc.data());
        })
        //console.log(obj);
        res.render('enroll.ejs',{result:req.session, res1:obj}); 
        })
        //console.log(obj);
        //res.send('.')
    }
    else{
        var Reference=[];
        req.session.courseType = 0;
        console.log("Hello");
        dataRef = db.collection('courses').doc(req.query.id);   
        userRef = db.collection('users').doc(req.session.roll);  
        db.collection("users").doc(req.session.roll).collection('enrolled').doc(dataRef.id).set({
                    dataRef
                }).then(()=>{res.redirect('/enroll')});
        db.collection('courses').doc(req.query.id).get().then((data)=>{
            if(data.data().users){
                Reference = data.data().users;
                Reference.push(req.session.roll);
                console.log(Reference);
                db.collection('courses').doc(req.query.id).update({
                    name:data.data().name,
                    id:data.data().id,
                    credit:data.data().credit,
                    users:Reference
                })

            }
            else{
                Reference.append(req.session.roll);
                console.log(Reference);

                db.collection('courses').doc(req.body.id).update({
                    name:data.data().name,
                    id:data.data().id,
                    credit:data.data().credit,
                    userRef:Reference
                })
            }
        })
        
        }
    
})

app.get('/courseGet', (req,res)=>{
    cname = req.query.cname;
    db.collection('courses').where("name", "==", cname).get().then((data)=>{
        data.forEach(doc =>{
            req.session.courseType = Number(1);
            console.log(req.session.courseType);
            res.render('enroll.ejs',{result:req.session, res1:doc.data()})
        })
        
    })
})

app.get('/edit',(req,res)=>{
    db.collection('users').doc(req.session.roll).get().then((data)=>{
        console.log(data.data())
        res.render('editprofile.ejs', {result:req.session, res1:data.data()});
    })
    
})

app.post('/editSubmit', (req,res)=>{
    db.collection('users').doc(req.session.roll).update({
                                                        fname:req.body.fname,
                                                        lname:req.body.lname,
                                                        pass:req.body.pass,
                                                        email:req.body.email,
                                                        roll:req.session.roll,
                                                        type:req.session.type
                                                }).then(()=>{
                                                    res.redirect('/home')
                                                })
            })

app.get('/showEnroll', (req,res)=>{
    var courses = [];
    var size;
    var i = Number(0);
    db.collection("users").doc(req.session.roll).collection("enrolled").get().then((data)=>{
        size1 = data.size;
        console.log(size1)
        data.forEach(doc =>{
            i++;
            console.log(i + " " + size1)
            console.log(doc.id);
            //console.log("This is the user ref" + doc.data().userRef.id)
            db.collection('courses').doc(doc.id).get().then((snap)=>{
                console.log(snap.data().name)
                courses.push(snap.data());
            })
        })
        setTimeout(() => {
            console.log(courses);
            console.log(courses[0].name);
            res.render('enrolled.ejs', {result:req.session, res1:courses}); 
        }, 6000);
        
    }).catch((err)=>{
        //res.send(err)
    })
    
})

//admin module
app.get('/admin', (req,res)=>{
    res.send("<div style='margin-top:210px;'><form align='center' method='POST' action='/adminlogin'><br><input type='text' name='uname' placeholder='Username'><br><br><input type='password' name='pass' placeholder='Password'><br><br><button type='submit'>Submit</button</div>")
})

app.post('/adminlogin', (req,res)=>{
    name = req.body.uname;
    pass = req.body.pass;
    if(name == 'admin' && pass == 'admin')
    {
        res.redirect('/adminhome');
    }
})

app.get('/adminhome', (req,res) => {
    res.render('adminhome.ejs');
})

app.post('/courseAdd', (req,res)=> {
    cname = req.body.cname;
    cid = req.body.cid;
    cred = Number(req.body.credit);
    db.collection('courses').doc(cid).set({
        name:cname,
        id:cid,
        credit:cred,
        users:[]
    }).then(()=>{
        res.send("The course has been added. Click <a href='/adminhome'>here</a> to go back");
    })
})



app.get('/logout', (req,res) =>{
    req.session = null;
    res.send("You have been logged out click <a href='/'>here</a> to go back to the login page")
})

app.listen(port, ()=>{
    console.log('Listening in '+ port)
})