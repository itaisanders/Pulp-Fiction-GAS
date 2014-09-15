function doGet(e) {
  var html = "main";
//  if (e.parameter.book) {
//    html = "book";
//  } 
  var app = HtmlService.createTemplateFromFile(html);
  app.parameter = e.parameter;
  app.user = Database.getUser();
  
  return app.evaluate();
}


function goToCategory(category) {
  Logger.log("changing category");
  Logger.log(category);
  var html = HtmlService.createTemplateFromFile("bookthumb");
  html.parameter = {category: category};
  return html.evaluate().getContent();
}

function search(input, startIndex) {
  Logger.log(input+startIndex);
  var query = input.query || input;
  if (!query) { 
    var html = HtmlService.createTemplateFromFile("bookshelf");
    html.parameter = {user: 1};
    html.user = Database.getUser();
    return html.evaluate().getContent();
  }
  
  var html = HtmlService.createTemplateFromFile("queryresults");
  
  html.query = query;
  html.startIndex = startIndex || 0;
  html = html.evaluate().getContent();
  return html;
}


function addBook(gbid) {
  if (!gbid) {
    return null; 
  }
  Logger.log(gbid);
  var book = QueryGoogleBooks.getByGBId(gbid);
  book = Database.addNewBook(book);
  Logger.log(book);

  if (book) {
    return book.getId();
  } else {return null;}
}

//function addBook(form) {
//  var isbn = form.isbn;
//  if (!isbn) {
//    return null; 
//  }
//  var book = Database.addByIsbn(isbn);
//  Logger.log(book);
//  
//  if (book) {
//    return book.getId();
//  } else {return null;}
//}

function getValues(form) {
  Logger.log("hello");
  var values = {
    title: form.title,
    subtitle: form.subtitle,
    description: form.description,
    category: form.category,
    pages: form.pages
  }
  Logger.log(values);
  return values;
}


function updateBook(id, form) {
  var book = Database.getObjectById(id);
//  book.title = form.title;
//  book.subtitle = form.subtitle;
//  Logger.log("authors: "+form.authors);
//  book.authors = form.authors.split(",");
  
  book.description = form.description;
  book.category = form.category;
  book.pages = parseInt(form.pages);
  
  book = Database.updateBook(book);
  
//  var html = HtmlService.createTemplateFromFile("book");
//  html.parameter = {book: id};
//  return html.evaluate().getContent();
  return loadBookDetails(id);
}

function revertToGoogleData(id) {
  Database.revertToGoogleData(id);
  return loadBookDetails(id);
}

function deleteInstance(id) {
  var book = Database.getObjectById(id).generic;
  Database.removeBook(id);
  return loadBookStatus(book);
}

function register(name) {
  var user = Database.addBookshelf(name);
  var html = HtmlService.createTemplateFromFile("bar");
  html.parameter = {user: 1};
  html.user = Database.getUser();
  return html.evaluate().getContent();
}

function changeSubscription(checked) {
  if (checked) {
    Database.subscribe();
   Logger.log("now i am checked") ;
  } else {
    Database.unsubscribe();
   Logger.log("now i am not checked") ; 
  }
}


function loadBar(user) {
  var html = HtmlService.createTemplateFromFile("bar");
  html.user = Database.getUser();;
  return html.evaluate().getContent();
}

function loadFilters(category) {
  var html = HtmlService.createTemplateFromFile("filters");
  html.parameter = {category: category};
  return html.evaluate().getContent();
}

function loadBookDetails(book) {
  var html = HtmlService.createTemplateFromFile("book");
  html.parameter = {book: book};
  return html.evaluate().getContent();
}

function loadBookStatus(book) {
  var html = HtmlService.createTemplateFromFile("status");
  html.parameter = {book: book};
  html.user = Database.getUser();
  return html.evaluate().getContent();
}

function loadUser(user) {
  var html = HtmlService.createTemplateFromFile("user");
  html.parameter = {user: user};
  html.user = Database.getUser();
  return html.evaluate().getContent();
}

function loadBookshelf(user) {
  var html = HtmlService.createTemplateFromFile("bookshelf");
  html.parameter = {user: user};
  html.user = Database.getUser();
  return html.evaluate().getContent();
}

function loadBookForm(book) {
  var html = HtmlService.createTemplateFromFile("bookform");
  html.parameter = {book: book};
  html = html.evaluate().getContent();
  return html;
}

function loadQueryInput(query) {
  var html = HtmlService.createTemplateFromFile("queryinput");
  html.query = query;
  return html.evaluate().getContent();
}

function loadQueryOutput(query, startIndex) {
  var html = HtmlService.createTemplateFromFile("queryresults");
  html.query = query;
  html.startIndex = startIndex;
  return html.evaluate().getContent();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

