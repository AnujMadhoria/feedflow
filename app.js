const express = require('express');
const app = express();
const userModel =require("./models/user");
const postModel =require("./models/post"); 
const path = require('path')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken'); 
const multerconfig = require("./config/multerconfig")

app.set("view engine","ejs");
app.use(express.json());  
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")))
app.use(cookieParser());

app.get('/',(req,res) => {
   res.render("index");  
});

app.post('/register', async (req,res) =>{
    let {email,password,username,name,age}=req.body; 
 
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("user already registered")

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password/* req.body.password */,salt, async(err,hash)=>{
            let user = await userModel.create({
                username,
                email,
                age, 
                name,
                password:hash
            });

            let token = jwt.sign({email:email, userid:user._id}, "secret");
            res.cookie("token",token);
            res.redirect("/profile");
        })
    })
})   

app.get('/login',(req,res) => {
    res.render("login");  
});

app.post('/login', async (req,res) =>{
    let {email,password}=req.body; 

    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("Something went wrong")

    bcrypt.compare(password/* req.body.password */, user.password, function( err, result){//ye password check ke liy compare hora user jo pass dal ra vo or jo saved kra hua he vha se
        if(result){
            let token = jwt.sign({email:email, userid:user._id}, "secret");
            res.cookie("token",token);
            res.status(200).redirect("/profile")
        } 
        else res.redirect("/login")    
    })
})   

app.get('/profile', isLoggedIn , async(req,res) => {
    let user = await userModel.findOne({email:req.user.email}).populate('posts');
    
    /*console.log(user); check krne ke liy*/
    res.render("profile", {user: user});
}); 

app.get('/like/:id', isLoggedIn , async(req,res) => {
    let post = await postModel.findOne({_id : req.params.id}).populate('user');//post model me humne user ko id mana he islia use humne populate kia he jisse hume data mil jay 
    
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid)
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }
    
    await post.save()
    res.redirect("/profile");
}); 

app.get('/edit/:id', isLoggedIn , async(req,res) => {
    let post = await postModel.findOne({_id : req.params.id}).populate('user');//post model me humne user ko id mana he islia use humne populate kia he jisse hume data mil jay 
    
    res.render("edit",{post});
});

app.get('/delete/:id', isLoggedIn , async(req,res) => {
    let post = await postModel.findOneAndDelete({_id : req.params.id}) 
    
    res.redirect("/profile");
});

app.post('/update/:id', isLoggedIn , async(req,res) => {
    let post = await postModel.findOneAndUpdate({_id : req.params.id}, {content: req.body.content})//post model me humne user ko id mana he islia use humne populate kia he jisse hume data mil jay 
    
    res.redirect("/profile");
});

app.post('/post',isLoggedIn , async (req,res) =>{ //post tbhi kr skte jb tum logged in ho pehle se hi islia is route ko isLoggedIn se pass kraenge
    let user= await userModel.findOne({email: req.user.email}) //check kro user ko 
    //agr nhi mila to fir middleware(isLoggedIn) se login pe redirect hojaenge
    let {content} = req.body; //destructuring
    
    //ase create kr paenge user post ko
    let post = await postModel.create({
        user:user._id,
        content:content
    });
    //ab user ka post push and save hoega
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")
})    

app.get('/logout',(req,res) => { 
    res.cookie("token", "")
    res.redirect("/login");  
});

function isLoggedIn(req,res,next){ //middleware for protected routes (logged in ko check kre k lia)
    if(req.cookies.token ==="")res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token, "secret")
        req.user = data; //jb login hojaenge to user ko data chia hoga apna to vo yha se send kr re req vale part me function me
        next();
    }
    
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
