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

Item.belongsTo(Category, { foreignKey: 'category' });

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("unable to sync the database", err);
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(data => resolve(data))
      .catch(err => {
        reject("no results returned", err);
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
        reject("no results returned", err);
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
        reject("no published items found", err);
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
        reject("no results returned", err);
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
        reject("no results returned", err);
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
          reject("unable to create item");
        });
    } catch (err) {
      reject("unable to create item", err);
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
            reject("unable to delete item", err);
          });
      })
      .catch(err => {
        reject("unable to find item", err);
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(data => resolve(data))
      .catch(err => {
        reject("no results returned", err);
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
        reject("unable to create category", err);
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
            reject("unable to delete category", err);
          });
      })
      .catch(err => {
        reject("unable to find category", err);
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
