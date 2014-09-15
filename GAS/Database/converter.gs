function convertToParse() {
  
  clearDb();
  Utilities.sleep(1000);
  
  convertBookshelf();
  Utilities.sleep(1000);
  convertCategories();
  Utilities.sleep(1000);
  convertGeneric();
  Utilities.sleep(1000);
  convertInstance();
  
  Logger.log("done converting");
}

function fixAll() {
  fixBookshelf();
  Utilities.sleep(2000);
  fixGeneric();
  Utilities.sleep(2000);
  fixInstance();
  
  Logger.log("done fixing");
}

function fixBookshelf() {
  var type1 = "bookshelf";
  var type2 = "bookshelf";
  
  var dbShelf = ParseDb.getMyDb(applicationId, restApiKey, type2);
  var query = dbShelf.query({});
  
  while (query.hasNext()) {
    var obj = query.next();
    
//    Logger.log("fixing "+obj.name);
    
    var oldInst = obj.instances;
    var oldGen = obj.books;
    
    var newInst =  [];
    var newGen = [];
    
    var dbInst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
//    Logger.log(oldInst);
    for (var i = 0 ; i < oldInst.length ; i++) {
      newInst.push(dbInst.query({oldId: oldInst[i]}).next().getId());
      Utilities.sleep(1000);
    }
//    Logger.log(newInst);
    var dbGen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
//    Logger.log(oldGen);
    for (var i = 0 ; i < oldGen.length ; i++) {
      newGen.push(dbGen.query({oldId: oldGen[i]}).next().getId());
      Utilities.sleep(1000);
    }
//    Logger.log(newGen);
    obj.instances = newInst;
    obj.books = newGen;
    
    dbShelf.save(obj);
  }
  
  Logger.log("fixed "+type1);
}


function fixGeneric() {
  var type1 = "book#generic";
  var type2 = "book_generic";
  
  var dbGen = ParseDb.getMyDb(applicationId, restApiKey, type2);
  var query = dbGen.query({});
  
  while (query.hasNext()) {
    var obj = query.next();
    
//    Logger.log("fixing "+obj.name);
    
    var oldInst = obj.instances;
    
    var newInst =  [];
    
    var dbInst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
//    Logger.log(oldInst);
    for (var i = 0 ; i < oldInst.length ; i++) {
      newInst.push(dbInst.query({oldId: oldInst[i]}).next().getId());
      Utilities.sleep(1000);
    }
//    Logger.log(newInst);
    obj.instances = newInst;
    
    dbGen.save(obj);
  }
  
  Logger.log("fixed "+type1);
}

function fixInstance() { 
  var type1 = "book#instance";
  var type2 = "book_instance";
  
  var dbInst = ParseDb.getMyDb(applicationId, restApiKey, type2);
  var query = dbInst.query({});
  
  while (query.hasNext()) {
    Utilities.sleep(1000);

    var obj = query.next();
    
//    Logger.log("fixing "+obj.toJson());
    
    var oldId = obj.generic;
    var oldOwner = obj.owner;
    var oldHolder = obj.holder;
    
    var newId;
    var newOwner;
    var newHolder;
    
    var dbGen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
//    Logger.log(oldInst);
      newId = dbGen.query({oldId: oldId}).next().getId();
//    Logger.log(newInst);
    var dbShelf = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
//    Logger.log(oldGen);
    newOwner = dbShelf.query({oldId: oldOwner}).next().getId();
    newHolder = dbShelf.query({oldId: oldHolder}).next().getId();
//    Logger.log(newGen);
    obj.generic = newId;
    obj.owner = newOwner;
    obj.holder = newHolder;
    
    dbInst.save(obj);
  }
  
  Logger.log("fixed "+type1);
}


function convertBookshelf() {
  var type1 = "bookshelf";
  var type2 = "bookshelf";
  
  var old = ScriptDb.getMyDb().query({type: type1});
  var fresh = ParseDb.getMyDb(applicationId, restApiKey, type2);
  
  while (old.hasNext()) {
    var obj = old.next();
    
    fresh.save({
      oldId: obj.getId(),
      owner: obj.owner,
      instances: obj.instances,
      books: obj.books,
      name: obj.name
    });
  }
  
  Logger.log("coverted "+type1);
}

function convertCategories() {
  var type1 = "list#categories";
  var type2 = "list";
  
  var obj = ScriptDb.getMyDb().query({type: type1}).next();
  var fresh = ParseDb.getMyDb(applicationId, restApiKey, type2);
  
  obj = fresh.save({
    oldId: obj.getId(),
    type: "categories",
    list: obj.list
  });
  
  PropertiesService.getScriptProperties().setProperty("categories", obj.getId());
  
  Logger.log("coverted "+type1);
}

function convertGeneric() {
  var type1 = "book#generic";
  var type2 = "book_generic";
  
  var old = ScriptDb.getMyDb().query({type: type1});
  var fresh = ParseDb.getMyDb(applicationId, restApiKey, type2);
  
  while (old.hasNext()) {
    var obj = old.next();
//    try {
    fresh.save({
      oldId: obj.getId(),
      gbid: obj.gbid,
      title: obj.title,
      authors: obj.authors,
      category: obj.category,
      description: obj.description,
      isbn: obj.isbn,
      pages: parseInt(obj.pages),
      language: obj.language,
      cover: obj.cover,
      instances: obj.instances,
      date: obj.date
    });
//    } catch (error) {
//      Logger.log(obj.toJson());
//  }
  }
  
  Logger.log("coverted "+type1);
}

function convertInstance() {
  var type1 = "book#instance";
  var type2 = "book_instance";
  
  var old = ScriptDb.getMyDb().query({type: type1});
  var fresh = ParseDb.getMyDb(applicationId, restApiKey, type2);
  
  while (old.hasNext()) {
    var obj = old.next();
    
    var genId = obj.id;
    
    fresh.save({
      oldId: obj.getId(),
      generic: genId,
      owner: obj.owner,
      holder: obj.holder,
      queue: obj.queue
    });
  }
  
  Logger.log("coverted "+type1);
}


function clearDb() {
  var dbShelf = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
  var dbGen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var dbInst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  var dbList = ParseDb.getMyDb(applicationId, restApiKey, "list");
  
  Utilities.sleep(1000);
  var query = dbShelf.query({});
  while (query.hasNext()) {
    dbShelf.remove(query.next()); 
  }
  
  Utilities.sleep(1000);
  query = dbGen.query({});
  while (query.hasNext()) {
    dbGen.remove(query.next()); 
  }
  
  Utilities.sleep(1000);
  query = dbInst.query({});
  while (query.hasNext()) {
    dbInst.remove(query.next()); 
  }
  
  Utilities.sleep(1000);
  query = dbList.query({});
  while (query.hasNext()) {
    dbList.remove(query.next()); 
  }
  
  Logger.log("db cleared");
}

/**
* Exports the contents of the ScriptDB database to a series of JSON files.
* Each export has its own folder, and the files in that folder contain the
* JSON equivalents of each record, one record per line. If the export
* function times out before it can complete, this function throws an error
* instructing you to run the function again so that it can pick up where it
* left off.
*/
/**
function exportScriptDb() {
  // The name of the folder to export to. Change as needed.
  var EXPORT_FOLDER_NAME = 'Export-' + new Date().toISOString();
  
  // The name of the property that holds the next page number to export.
  var PAGE_NUMBER_PROPERTY = 'scriptDbExport.pageNumber';
  
  // The name of the property that holds the ID of the folder to export to.
  var FOLDER_ID_PROPERTY = 'scriptDbExport.folderId';
  
  // The amount of time, in milliseconds, that the script can run for before
  // it is stopped (5 minutes).
  var TIMEOUT_MS = 5 * 60 * 1000;
  
  // The number of records to export to a single file.
  var PAGE_SIZE = 1000;
  
  var properties = PropertiesService.getScriptProperties();
  
  var folderId = properties.getProperty(FOLDER_ID_PROPERTY);
  var folder;
  if (folderId) {
    folder = DriveApp.getFolderById(folderId);
  } else {
    folder = DriveApp.createFolder(EXPORT_FOLDER_NAME);
    properties.setProperty(FOLDER_ID_PROPERTY, folder.getId());
  }
  
  var pageNumber = properties.getProperty(PAGE_NUMBER_PROPERTY) || 0;
  var db = ScriptDb.getMyDb();
  var now = new Date();
  var finished = false;
  
  for (var start = new Date().getTime(); now - start < TIMEOUT_MS;
       now = new Date()) {
    var page = db.query({}).paginate(pageNumber, PAGE_SIZE);
    if (page.getSize() == 0) {
      finished = true;
      break;
    }
    var results = [];
    while (page.hasNext()) {
      var item = page.next();
      results.push(item.toJson());
    }
    var content = results.join('\n');
    var fileName = Utilities.formatString('part-%03d.json', pageNumber);
    folder.createFile(fileName, content, 'application/json');
    pageNumber++;
    properties.setProperty(PAGE_NUMBER_PROPERTY, pageNumber);
  }
  if (finished) {
    Logger.log('Export complete');
    properties.deleteProperty(FOLDER_ID_PROPERTY);
    properties.deleteProperty(PAGE_NUMBER_PROPERTY);
  } else {
    throw 'Export timed out. Run the function again to continue.';
  }
}
*/
