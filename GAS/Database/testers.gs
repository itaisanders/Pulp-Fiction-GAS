function showUsers() {
  var db = ScriptDb.getMyDb();
  var query = db.query({type: "bookshelf"});
  while (query.hasNext()) {
    Logger.log(query.next()) ;
  }
  
}


function testAddBook() {
//  var user = Session.getEffectiveUser().getEmail();
  var db = ScriptDb.getMyDb();
  
  var book = QueryGoogleBooks.test();
  
  addBookshelf("איתי");
  
  
  addNewBook(book);
  showDb();
}

function testRemoveBook() {
//  var user = Session.getEffectiveUser().getEmail();
  var db = ScriptDb.getMyDb();
 
  var book = QueryGoogleBooks.test();
  var query = db.query({isbn:book.isbn});
  if (query.hasNext()) {
    book = query.next(); 
  }
  Logger.log("REMOVING BOOK "+book.instances[0]);
  removeBook(book.instances[0]);
  showDb();
}

function testRemoveBookshelf() {
  removeBookshelf();
  showDb();
}

function testGetBookOwners() {
  Logger.log(getBookOwners("S406466902252"));
}

function clearDb() {
  var db = ScriptDb.getMyDb();
  
  var query = db.query({});
  while (query.hasNext()) {
    db.remove(query.next()); 
  }
  PropertiesService.getUserProperties().deleteAllProperties();
  PropertiesService.getScriptProperties().deleteAllProperties();
  showDb();
}

function testBooksInBookshelf() {
  var user = PropertiesService.getUserProperties().getProperty('id');
  Logger.log(booksInBookshelf(user));
}

function testBooksInCategory() {
  var category = "Adventure stories";
  Logger.log(booksInCategory(category));
}

function showDb() {
  showUserProps();
  var db = ScriptDb.getMyDb();
  var query = db.query({});
  while (query.hasNext()) {
    var i = query.next();
    Logger.log("["+i.getId()+"]"+i.toJson());
  }  
}

function showUserProps() {
  var prop = PropertiesService.getUserProperties();
  Logger.log(prop.getProperties());
}

function clearUserProps() {
   var prop = PropertiesService.getUserProperties().deleteAllProperties();
  Logger.log(prop.getProperties());
}
function showScriptProps() {
  var prop = PropertiesService.getScriptProperties();
  Logger.log(prop.getProperties());
}
