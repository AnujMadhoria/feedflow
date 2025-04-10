const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

//disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
      crypto.randomBytes(12,function(err,name){ // crypto se random name bnega jisse humari same name vali files overwrite nhi hogi
        const fn = name.toString("hex")+path.extname(file.originalname); // fn filename //extname = extension
        cb(null, fn);
      })
      
    }
  })
  

  //export upload variable 
const upload = multer({ storage: storage })
module.exports = upload;

// ye dono perform honge idhr se