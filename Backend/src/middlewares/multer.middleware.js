import multer from "multer";

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },

  filename: function (req, file, cb) {
    
    console.log("File parameter in Multer :", file);

    cb(null, file.originalname);
  }
});

export const upload = multer({ 
    storage: storage // OR storage <== this is new syntax in ES6
})

// destination and filename. They are both functions that determine where the file should be stored.
// destination is used to determine within which folder the uploaded files should be stored.
//filename is used to determine what the file should be named inside the folder. If no filename is given, each file will be given a random name that doesn't include any file extension.

//Note: Multer will not append any file extension for you, your function should return a filename complete with a file extension.