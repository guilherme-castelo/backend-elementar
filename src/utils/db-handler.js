const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class DBHandler {
  constructor() {
    this.dbPath = path.resolve(__dirname, '..', config.DB_PATH);
    this.data = {
      users: [],
      companies: [],
      employees: [],
      meals: [],
      tasks: [],
      notifications: [],
      conversations: [],
      messages: [],
      comments: [],
      roles: [],
      permissions: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log('Database loaded successfully.');
      } else {
        console.log('Database file not found, creating new one...');
        this._save();
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  getById(collection, id) {
    const list = this.get(collection);
    // loose equality to match string/number IDs
    return list.find(item => item.id == id);
  }

  add(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].push(item);
    this._save();
    return item;
  }

  update(collection, id, updates) {
    const list = this.data[collection];
    const index = list.findIndex(item => item.id == id);

    if (index === -1) return null;

    const updatedItem = { ...list[index], ...updates };
    this.data[collection][index] = updatedItem;
    this._save();
    return updatedItem;
  }

  delete(collection, id) {
    const list = this.data[collection];
    const index = list.findIndex(item => item.id == id);

    if (index === -1) return false;

    this.data[collection].splice(index, 1);
    this._save();
    return true;
  }

  // Specific query helpers can be added here
}

module.exports = new DBHandler();
