require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

let sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: process.env.PGPORT,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

// define models
const Category = sequelize.define('Category', {
  category: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

const Item = sequelize.define('Item', {
  body: {
    type: Sequelize.TEXT
  },
  title: {
    type: Sequelize.STRING
  },
  postDate: {
    type: Sequelize.DATE
  },
  featureImage: {
    type: Sequelize.STRING
  },
  published: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  price: {
    type: Sequelize.DOUBLE
  }
});

// define relationships
Item.belongsTo(Category, { foreignKey: 'category' });

// Functions
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        console.log("Database synchronized successfully.");
        resolve();
      })
      .catch((err) => {
        console.error("Unable to sync the database:", err);
        reject("unable to sync the database");
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(data => resolve(data))
      .catch(err => {
        console.error("Database error in getAllItems:", err);
        reject("Database operation failed");
      });
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({ 
      where: { category: category },
      include: [Category]
    })
      .then((data) => resolve(data))
      .catch((err) => {
        console.error("Error getting items by category:", err);
        reject("no results returned");
      });
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;
    Item.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr)
        }
      },
      include: [Category]
    })
      .then((data) => resolve(data))
      .catch((err) => {
        console.error("Error getting items by min date:", err);
        reject("no results returned");
      });
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true },
    })
      .then(data => resolve(data))
      .catch(err => {
        console.error("Error getting published items:", err);
        reject("no published items found");
      });
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
        category: category
      },
      include: [Category]
    })
      .then((data) => resolve(data))
      .catch((err) => {
        console.error("Error getting published items by category:", err);
        reject("no results returned");
      });
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { id: id },
      include: [Category]
    })
      .then(data => {
        if (data && data.length > 0) {
          resolve(data[0]);
        } else {
          reject("item not found");
        }
      })
      .catch(err => {
        console.error("Error getting item by ID:", err);
        reject("no results returned");
      });
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    try {
      itemData.published = itemData.published ? true : false;

      for (let prop in itemData) {
        if (itemData[prop] === "") {
          itemData[prop] = null;
        }
      }

      itemData.postDate = new Date();

      Item.create(itemData)
        .then(result => resolve(result))
        .catch(err => {
          console.error("Error adding item:", err);
          reject("unable to create post");
        });
    } catch (error) {
      console.error("Error in addItem:", error);
      reject("unable to create post");
    }
  });
}

function deletePostById(id) {
  return new Promise((resolve, reject) => {
    Item.findByPk(id)
      .then(item => {
        if (!item) {
          reject("item not found");
          return;
        }

        Item.destroy({ where: { id: id } })
          .then(() => resolve())
          .catch(err => {
            console.error("Error deleting item:", err);
            reject("unable to delete item");
          });
      })
      .catch(err => {
        console.error("Error finding item:", err);
        reject("unable to find item");
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(data => resolve(data))
      .catch(err => {
        console.error("Error getting categories:", err);
        reject("no results returned");
      });
  });
}

function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    for (const key in categoryData) {
      if (categoryData[key] === "") {
        categoryData[key] = null;
      }
    }

    Category.create(categoryData)
      .then(() => resolve())
      .catch(err => {
        console.error("Error adding category:", err);
        reject("unable to create category");
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.findByPk(id)
      .then(category => {
        if (!category) {
          reject("category not found");
          return;
        }

        Category.destroy({ where: { id: id } })
          .then(() => resolve())
          .catch(err => {
            console.error("Error deleting category:", err);
            reject("unable to delete category");
          });
      })
      .catch(err => {
        console.error("Error finding category:", err);
        reject("unable to find category");
      });
  });
}

module.exports = {
  sequelize,
  Item,
  Category,
  initialize,
  getAllItems,
  getItemsByCategory,
  getItemsByMinDate,
  getPublishedItems,
  getPublishedItemsByCategory,
  getItemById,
  addItem,
  deletePostById,
  getCategories,
  addCategory,
  deleteCategoryById
};
