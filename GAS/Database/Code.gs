/*
* things to consider:
*    1. using SiteApp api to create and update user's reader-card page.
*    2. implementing more query types [borrowed by user, borrowed from user, etc].
*/


/**
* after giving it some consideration i will change the database to hold the following structures:
*       1. bookshelves => {type: "bookshelf", owner: [user email address], instances[]: [books by instance id], books[]: [books by generic id], name: [chosen display name]}
*       2. generics books => {type: "book#generic", gbid: [googlebooks id], title: [book title], authors[]: [list of authors], category: [book category],
*                                    description: [book decription], isbn: [book isbn], pages: [number of pages], language: [language in two letters code],
*                                    cover{}: [url addresses to book cover image in different sizes], instances[]: [list of book instances in db], date: [date added]}
*       3. book instances => {type: "book#instance", id: [generic id], owner: [user owning the book], holder: [user currently holding the book], queue: [readers who ordered the book]}
*       4. book categories => {type: "list#categories", list[]: [list of categories]}
*
* i switched all login to work with ScriptDb id. seems to work fine.
* needs to implement functions to return actual objects from database..id
*/


/**
* get actual object by database id.
*/
function getObjectById(id) {
  var obj;
  var db = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  obj = db.load(id);
  if (obj) { return obj; }
  
  db = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  obj = db.load(id);
  if (obj) { return obj; }
  
  db = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
  obj = db.load(id);
  if (obj) { return obj; }
  
  db = ParseDb.getMyDb(applicationId, restApiKey, "list");
  obj = db.load(id);
  if (obj) { return obj; }
  
  return null;
}

function getBookByGBId(id) {
  //  var db = ScriptDb.getMyDb();
  var db = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var query = db.query({gbid:id});
  if (query.hasNext()) {
    return query.next(); 
  } else { return null; }
}

function addByIsbn(isbn) {
  var book = QueryGoogleBooks.query(isbn);
  
  return addNewBook(book);
}

/**
* adds a new book to the database, owned and held by the user.
*/
function addNewBook(e) {
  if (e == null || e.isbn == null) {return null}
  
//  var db = ScriptDb.getMyDb();  
  var db_gen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var db_inst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  var db_shelf = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
  convertUser();
  var user = PropertiesService.getUserProperties().getProperty('id');
  
  var book = e;
  var gbidCheck = db_gen.query({gbid: book.gbid});
  if (book.id == null && !gbidCheck.hasNext()) {
//    book.type = "book#generic";
    book.instances = [];
    book.date = (new Date()).getTime();
    book = db_gen.save(book);
    addCategory(book.category); 
  }
  
  if (book.type == null && gbidCheck.hasNext()) {
    book = gbidCheck.next();
  }
  
  var instance = {
//    type: "book#instance",
    generic: book.getId(),
    owner: user,
    holder: user,
    queue: []
  }
  instance = db_inst.save(instance);

  book.instances.push(instance.getId());
  book = db_gen.save(book);
  
  var bookshelf = db_shelf.load(user);
  bookshelf.instances.push(instance.getId());
  var add = true;
  for (var i = 0 ; i < bookshelf.books.length ; i++) {
    if (bookshelf.books[i] == book.getId()) { 
      add = false;
    }
  }
  if (add) {
    bookshelf.books.push(book.getId());
  }
  bookshelf = db_shelf.save(bookshelf);
  
  return book;
}

/**
* updating a book. must recieve original book object as produced from getObjectById.
*/
function updateBook(book) {
  Logger.log("updating book ");
  Logger.log(book.getId());
  
  var db = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  
  var catOut = db.load(book.getId()).category;
  Logger.log(catOut);
  
  try {
  book = db.save(book);
  Logger.log("book updated");
  } catch (error) {
    Logger.log("error updating");
    Logger.log(error);
  }
  deleteCategory(catOut);
  addCategory(book.category);
  
  Logger.log("done");
  return book;
}

function revertToGoogleData(id) {
//  var db = ScriptDb.getMyDb();
  var db = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var book = db.load(id);
  var original = QueryGoogleBooks.getByGBId(book.gbid);
  book.title = original.title;
  book.subtitle = original.subtitle;
  book.authors = original.authors;
  var catOut = book.category;
  book.description = original.description;
  book.pages = original.pages;
  
  if (book.cover && original.cover) {
    book.cover.thumbnail = original.cover.thumbnail;
    book.cover.smallThumbnail = original.cover.smallThumbnail;
  }
  
  book.language = original.language;
  book.gbid = original.gbid;
  book.isbn = original.isbn;
  book = db.save(book);
  deleteCategory(catOut);
  addCategory(original.category);
  return book;
}

/**
* adds a new category to the category list if such category does not exist.
*/
function addCategory(category) {
//  var db = ScriptDb.getMyDb();  
  var db = ParseDb.getMyDb(applicationId, restApiKey, "list");
  
  if (category == null) {
    return 0; 
  }
  
  //  if (db.query({type: "list#categories"}).getSize() == 0) {
  
  if (PropertiesService.getScriptProperties().getProperty("categories") == null) {
    var id = db.save({type: "categories", list: [category]}).getId(); 
    PropertiesService.getScriptProperties().setProperty("categories", id);
    return 1;
  }
  var categories = db.load(PropertiesService.getScriptProperties().getProperty("categories"));
  for (var i = 0 ; i<categories.list.length ; i++) {
    if (categories.list[i] == category) {
      return 0;
    }
  }
  categories.list.push(category);
  categories.list = categories.list.sort();
  db.save(categories);
  return 1;
}

/**
* checks if there are books in category. if no books left deletes that category.
*/
function deleteCategory(catOut) {
//  var db = ScriptDb.getMyDb();
  var db = ParseDb.getMyDb(applicationId, restApiKey, "list");

  if (PropertiesService.getScriptProperties().getProperty("categories") == null) {
    return; 
  }
  var categories = db.load(PropertiesService.getScriptProperties().getProperty("categories"));
  //  Logger.log(categories);
  // if there are no more books in catOut, delete it from list.
  //  Logger.log(getBooksInCategory(catOut));
  if (getBooksInCategory(catOut).length == 0) {
    //      Logger.log(categories);
    for (var i = 0; i < categories.list.length ; i++) {
      if (categories.list[i] == catOut) {
        var tmp = categories.list[0];
        categories.list[0] = categories.list[i];
        categories.list[i] = tmp;
        categories.list.shift();
        categories.list = categories.list.sort();
        db.save(categories);
        break;
      }
    }
  }
}

/**
* adds a new bookshelf and a new user to the database.
*/
function addBookshelf(name) {
  //  var user = Session.getEffectiveUser().getEmail();
  var props = PropertiesService.getUserProperties();
  convertUser();
  var user = props.getProperty('id');
  
  if (/*db.query({type: "bookshelf", owner: user}).getSize() == 0*/ user == null){
    var bookshelf = {
      owner: Session.getEffectiveUser().getEmail(),
      name: name,
      converted: 1,
      books: [],
      instances: []
    };
//    var db = ScriptDb.getMyDb();
    var db = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
    bookshelf = db.save(bookshelf);
    props.setProperty('id', bookshelf.getId());
    props.setProperty('converted', 1);
    return 1;
  }
  return 0;
}


/**
* returns an array of all book instances owned by a user. represented by instance id.
*/
function booksInBookshelf(id) {
//  var db = ScriptDb.getMyDb();
  var dbShelf = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
  var dbGen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var books = [];  
  var bookshelf = dbShelf.load(id);
  
  for (var i = 0 ; i < bookshelf.books.length ; i++) {
    books.push(dbGen.load(bookshelf.books[i]));
  }
  Logger.log("books queried");
  return books;
}


/**
* returns an array of all books in a given catagory. represented by generic id.
*/
function getBooksInCategory(category) {
//  var db = ScriptDb.getMyDb();
//  var db_categories = ParseDb.getMyDb(applicationId, restApiKey, "list_categories");
  var db_gen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  
  var books = [];
  
  var query = db_gen.query({});
  while (query.hasNext()) {
    var book = query.next();
    if (category == "" || category == null || book.category == category) {
      books.push(book); 
    }
  }
  
  return books;
}


/**
* returns an array of all owners of a certain book, given by generic id. represented by user instance id.
*/
function getBookOwners(bookId) {
//  var db = ScriptDb.getMyDb();
  var db_gen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var db_inst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  var book = db_gen.load(bookId);
  
  if (book == null) {
    return null; 
  }
  var instances = book.instances;
  var owners = [];
  for (var i = 0 ; i < instances.length ; i++) {
    owners.push(db_inst.load(instances[i]).owner);
  }
  
  return owners;
}


/**
* changes a book's, given by local id, location to user.
*/
function takeBook(bookId) {
  //  var user = Session.getEffectiveUser().getEmail();
  convertUser();
  var user = PropertiesService.getUserProperties().getProperty('id');
//  var db = ScriptDb.getMyDb();
  var db = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  
  var book = db.load(bookId);
  if (book != null) {  
    book.holder = user;
    db.save(book);
    return 1;
  }
  
  return 0;
}


/**
* removes a book, given by local id, from database completely.
*/
function removeBook(bookId) {
//  var db = ScriptDb.getMyDb();
  Logger.log("removing "+bookId);
  var db_inst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  var db_gen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
//  var db_cat = ParseDb.getMyDb(applicationId, restApiKey, "list_categories");
  var db_shelf = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
  
  var book = db_inst.load(bookId);
  
  if (book != null){
    var generic = db_gen.load(book.generic);
    var bookshelf = db_shelf.load(book.owner);
    
    for (var i = 0; i < bookshelf.instances.length; i++) {
      if (bookshelf.instances[i] == bookId) {
        var tmp = bookshelf.instances[0];
        bookshelf.instances[0] = bookshelf.instances[i];
        bookshelf.instances[i] = tmp;
        bookshelf.instances.shift();
        break;
      }
    }
    
    var wasLast = true;
    for (var i = 0; i < bookshelf.instances.length; i++) {
      if (db_inst.load(bookshelf.instances[i]).generic == generic.getId()) {
        wasLast = false;
      }
    }
    if (wasLast) {
      for (var i = 0 ; i < bookshelf.books.length ; i++) {
        if (bookshelf.books[i] == generic.getId()) {
          var tmp = bookshelf.books[0];
          bookshelf.books[0] = bookshelf.books[i];
          bookshelf.books[i] = tmp;
          bookshelf.books.shift();
          break;
        }
      }
    }
    db_shelf.save(bookshelf);
    
    
    for (var i = 0; i < generic.instances.length; i++) {
      if (generic.instances[i] == bookId) {
        var tmp = generic.instances[0];
        generic.instances[0] = generic.instances[i];
        generic.instances[i] = tmp;
        generic.instances.shift();
        break;
      }
    }
    
    if (generic.instances.length > 0) {
      db_gen.save(generic);
    } else {
      
      db_gen.remove(generic) ;
      
      var category = generic.category;
      deleteCategory(category);
    }
    
    db_inst.remove(book);
    
    return 1;
  }
  
  return 0;
}


/**
* get owner, given by user id, name as registered in the db.
*/
function getOwnerName(id) {
//  var db = ScriptDb.getMyDb();
  var db = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
  
  var user = db.load(id);
  
  if (user != null) {
    return user.name;
  }
  
  return null;
}

/**
* get book instances.
*/
function getBookInstances(id) {
//  var db = ScriptDb.getMyDb();
  var dbGen = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  var dbInst = ParseDb.getMyDb(applicationId, restApiKey, "book_instance");
  
  var book =  dbGen.load(id);
  
  var instances = [];
  for (var i = 0 ; i < book.instances.length ; i++) {
    instances.push(dbInst.load(book.instances[i])) ;
    Logger.log(book.instances[i]);
  }
  
  return instances;
}

/**
* deletes active user and bookshelf.
*/
function removeBookshelf() {
  convertUser();
  var user = PropertiesService.getUserProperties();
  var id = user.getProperty('id')
  if (id != null) {
//    var db = ScriptDb.getMyDb();
    var db = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
    var bookshelf = db.load(id);
    //    db.removeByIdBatch(bookshelf.books, false);
    for (var i = 0 ; i < bookshelf.books.length ; i++) {
      removeBook(bookshelf.books[i]); 
    }
    unsubscribe();
    db.remove(bookshelf);
    user.deleteAllProperties();
    return 1;
  }
  
  return 0;
}

function getUser() {
  var id = PropertiesService.getUserProperties().getProperty("id");
  if (id) {
    
    convertUser();
    //    return ScriptDb.getMyDb().load(id);
    return ParseDb.getMyDb(applicationId, restApiKey, "bookshelf").load(id);
  }
  return null;
}

function convertUser() {
  var id = PropertiesService.getUserProperties().getProperty("id");
  if (id) {
    if (!PropertiesService.getUserProperties().getProperty("converted")) {
      var db = ParseDb.getMyDb(applicationId, restApiKey, "bookshelf");
      var user = db.query({oldId: id}).next();
      id = user.getId();
      PropertiesService.getUserProperties().setProperty("id", id);
      PropertiesService.getUserProperties().setProperty("converted", 1);
      user.converted = 1;
      db.save(user);
      Logger.log("user "+ id +" converted");
    }
  }
}

function getCategories() {
  var id = PropertiesService.getScriptProperties().getProperty("categories") ;
  
  if (id == null) {
    return null;
  }
  var categories = ParseDb.getMyDb(applicationId, restApiKey, "list").load(id);
  return categories.list;
}

function updateAll() {
//  var db = ScriptDb.getMyDb();
  var db = ParseDb.getMyDb(applicationId, restApiKey, "book_generic");
  
  var query = db.query({});
  
  while (query.hasNext()) {
    var book = query.next();
    Logger.log(book.title);
    revertToGoogleData(book.getId());
    Logger.log("reverted");
  }
}
