const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JSONCollection {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading ${this.filePath}:`, err);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing ${this.filePath}:`, err);
    }
  }

  _generateId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }

  async find(query = {}) {
    let items = this._read();
    
    // Support simple filter matching
    if (Object.keys(query).length > 0) {
      items = items.filter(item => {
        for (const key in query) {
          // Handle simple equality or search filter
          if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
            const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
            if (!regex.test(item[key] || '')) return false;
          } else if (query[key] !== undefined && item[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });
    }
    
    return items;
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items.length > 0 ? items[0] : null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id) || null;
  }

  async create(data) {
    const items = this._read();
    const newItem = {
      _id: this._generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    this._write(items);
    return newItem;
  }

  async findByIdAndUpdate(id, data, options = {}) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    // If we're updating specific fields
    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    items[index] = updatedItem;
    this._write(items);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    const deletedItem = items[index];
    items.splice(index, 1);
    this._write(items);
    return deletedItem;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

const db = {
  User: new JSONCollection('users'),
  Employee: new JSONCollection('employees'),
  Event: new JSONCollection('events'),
  EmployeeLedger: new JSONCollection('ledgers'),
  Expense: new JSONCollection('expenses'),
  Settings: new JSONCollection('settings'),
  Bill: new JSONCollection('bills'),
  Quotation: new JSONCollection('quotations'),
};

module.exports = db;
