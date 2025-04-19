/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Huynh Huy Hoang
Student ID: 151569233 
Date: April 18th, 2025
Replit Web App URL: https://d039bea6-9f96-404f-a08e-e86e90e97b77-00-k6kxv8ysii1l.riker.replit.dev/
GitHub Repository URL: https://github.com/Mehi2k5/web322-app

********************************************************************************/ 

const express = require("express");
const authData = require("./auth-service.js");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const storeService = require("./store-service");
const path = require("path");
const app = express();
const clientSessions = require("client-sessions");
const expressLayouts = require('express-ejs-layouts');
const PORT = process.env.PORT || 8080;

const studentName = "Huynh Huy Hoang";
const studentId = "151569233";

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressLayouts);

app.set("view engine", "ejs");
app.use(expressLayouts); 
app.set("views", path.join(__dirname, "views"));
app.set('layout', 'layouts/main');


app.use(clientSessions({
    cookieName: "session", 
    secret: "longRandomStringForEncryptingSession", 
    duration: 2 * 60 * 1000000, 
    activeDuration: 1000000 * 60 
}));

  app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.locals.equals = (lvalue, rvalue) => lvalue === rvalue;
app.locals.formatDate = function(dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

app.use((req, res, next) => {
    let route = req.path.toLowerCase();
    if (route.endsWith("/")) {
        route = route.slice(0, -1);
    }
    res.locals.activeRoute = route;
    res.locals.viewingCategory = req.query.category || '';
    next();
});

cloudinary.config({
    cloud_name: "deeaiac7s",
    api_key: "648412533771665",
    api_secret: "mbNbJSE1EpCyLH4GGF0XbiX3ePY",
    secure: true
});

const upload = multer(); 

storeService
  .initialize()
  .then(authData.initialize) 
  .then(() => {
    console.log("Project data initialized successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize project data:", error);
    process.exit(1);
  });

  function ensureLogin(req, res, next) {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    next();
  }  

app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get('/main', (req, res) => {
    res.render('home', { layout: 'layouts/main' });
  });

app.get("/about", (req, res) => {
    res.render("about", { title: "About Huynh Huy Hoang" });
});

app.get('/main', (req, res) => {
    res.render('home');
  });
  

app.get("/shop", async (req, res) => {
    try {
        const category = req.query.category || '';
        const [items, categories] = await Promise.all([
            storeService.getPublishedItems(),
            storeService.getCategories()
        ]);

        const filteredItems = category ? items.filter(item => item.category == category) : items;
        
        res.render("shop", {
            data: {
                post: filteredItems[0] || null,
                posts: filteredItems,
                categories: categories,
                message: filteredItems.length ? "" : "No items found for the selected category",
                categoriesMessage: categories.length ? "" : "No categories found"
            },
            viewingCategory: category
        });
    } catch (err) {
        console.error("Error in /shop route:", err);
        res.render("shop", {
            data: {
                post: null,
                posts: [],
                categories: [],
                message: "Unable to load items",
                categoriesMessage: "Unable to load categories"
            }
        });
    }
});

app.get("/shop/:id",  (req, res) => {
    const itemId = req.params.id;
    const category = req.query.category || '';
    
    storeService.getPublishedItems()
        .then(items => {
            const filteredItems = category ? items.filter(item => item.category == category) : items;
            
            storeService.getCategories()
                .then(categories => {
                    const currentPost = filteredItems.find(item => item.id == itemId) || null;
                    
                    res.render("shop", {
                        data: {
                            post: currentPost,
                            posts: filteredItems,
                            categories: categories,
                            message: currentPost ? "" : "Item not found",
                            categoriesMessage: categories.length ? "" : "No categories found"
                        },
                        viewingCategory: category
                    });
                })
                .catch(err => {
                    console.error("Error getting categories:", err);
                    res.render("shop", {
                        data: {
                            post: null,
                            posts: filteredItems,
                            categories: [],
                            message: "Item not found",
                            categoriesMessage: "Error loading categories"
                        }
                    });
                });
        })
        .catch(err => {
            console.error("Error getting published items:", err);
            res.render("shop", {
                data: {
                    post: null,
                    posts: [],
                    categories: [],
                    message: "Error loading items",
                    categoriesMessage: "Error loading categories"
                }
            });
        });
});

app.get("/items", ensureLogin, (req, res) => {
    storeService.getAllItems()
        .then(items => {
            res.render("items", { 
                items: items,
                message: items.length ? null : "no results"
            });
        })
        .catch(err => {
            console.error("Error getting items:", err);
            res.render("items", { 
                items: [],
                message: "no results" 
            });
        });
});


app.get("/items/add", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render("addItem", { 
                categories: categories,
                itemData: null,
                errorMessage: null
            });
        })
        .catch(err => {
            console.error("Error getting categories:", err);
            res.render("addItem", { 
                categories: [], 
                itemData: null,
                errorMessage: "Error loading categories"
            });
        });
});

app.post("/items/add", ensureLogin, upload.single("featureImage"), async (req, res) => {
    let imageUrl = "";
    if (req.file) {
        try {
            const result = await new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
            console.log("Cloudinary Upload Result:", result);
            imageUrl = result.secure_url || "";
        } catch (err) {
            console.error("Error uploading image to Cloudinary:", err);
            imageUrl = "";
        }
    }
    
    req.body.featureImage = imageUrl;
    if (req.body.categoryId) {
        req.body.categoryId = parseInt(req.body.categoryId);
    }
 console.log("Final item data to be added:", req.body);
    
    try {
        const addedItem = await storeService.addItem(req.body);
        console.log("Item added successfully:", addedItem);
        res.redirect("/items");
    } catch (err) {
        console.error("Error adding item:", err);
        res.status(500).send("Failed to add item");
    }
});
  
app.get("/categories", ensureLogin, (req, res) => {
    storeService.getCategories()
      .then(categories => {
        res.render("categories", { 
          categories: categories,
          errorMessage: categories.length ? null : "no results"
        });
      })
      .catch(err => {
        console.error("Error getting categories:", err);
        res.render("categories", { 
          categories: [],
          errorMessage: "no results" 
        });
      });
  });

app.get("/categories/add", ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(err => {
            res.render("addCategory", {
                message: "Unable to add category",
                categoryData: req.body  
            });
        });
});

app.post("/categories/add", ensureLogin, upload.single("featureImage"), ensureLogin, async (req, res) => {
    try {
        await storeService.addCategory(req.body);
        res.redirect("/categories");
    } catch (err) {
        console.error("Error adding category:", err);
        res.status(500).send("Failed to add category");
    }
});
  
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories");
        })
        .catch(err => {
            console.error("Error deleting category:", err);
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.get("/item/:id", ensureLogin, (req, res) => {
    storeService.getItemById(req.params.id)
        .then((item) => res.render("itemDetails", { item }))
        .catch(() => res.status(404).render("404", { message: "Item not found" }));
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => {
            res.redirect("/items");
        })
        .catch(err => {
            console.error("Error deleting item:", err);
            res.status(500).send("Cannot remove items");
        });
});

app.get("/login", (req, res) => {
    res.render("login");
});
  
  app.get("/register", (req, res) => {
    res.render("register");
});
  
  app.post("/register", (req, res) => {
    authData.registerUser(req.body)
      .then(() => {
        res.render("register", {
          errorMessage: "",
          successMessage: "User successfully created",
        });
      })
      .catch((err) => {
        res.render("register", {
          errorMessage: err,
          userName: req.body.userName
        });
      });
  });
  
  app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");

    authData.checkUser(req.body)
      .then((user) => {
        req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory
        };
        res.redirect("/items");
      })
      .catch((err) => {
        res.render("login", {
          errorMessage: err,
          userName: req.body.userName
        });
      });
  });
  
  app.get("/logout", (req, res) => {
    req.session.reset(); 
    res.redirect("/");
});

  
  app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", {
      session: req.session
    });
  });
  
app.use((req, res) => {
    res.status(404).render("404", {
      message: "Unable to find requested project.",
      studentName,
      studentId,
      timestamp: new Date().toISOString(),
    });
  });