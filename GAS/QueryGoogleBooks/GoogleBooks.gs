function queryMulti(string, startIndex) {
  if (!string) {return null}
  
  if (!startIndex) {startIndex = "0";}
  var key = "AIzaSyDI_wSb5YHByXIBKS_NwbsaRr-XRxTbpfQ";
  var query_line = "https://www.googleapis.com/books/v1/volumes?q="+string+"&startIndex="+startIndex+"&key="+key+"";
  
  var json = JSON.parse(UrlFetchApp.fetch(query_line));
  
  if (!json.items || json.items.length == 0) {
    return null; 
  }
  
  var items = json.items;
  var books = [];
  
  for (var i = 0 ; i < items.length ; i++) {
    
    var book = items[i].volumeInfo;

    var data = {
      gbid: items[i].id,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      category: book.mainCategory,
      description: book.description,
      isbn: [],
      pages: book.pageCount,
      language: book.language,
      cover: book.imageLinks
    };
    if (!book.mainCategory && book.categories) {
      data.category = book.categories.join(" / ");
    }
    if (book.industryIdentifiers) {
      for (var j = 0 ; j < book.industryIdentifiers.length ; j++) {
        data.isbn.push(book.industryIdentifiers[j].identifier);
      }
    }
    books.push(data);

  }
  return books;
}


function querySingle(e) {
  if (e == null) {return null}
  
  var key = "AIzaSyDI_wSb5YHByXIBKS_NwbsaRr-XRxTbpfQ";
  var query_line = "https://www.googleapis.com/books/v1/volumes?q="+e+/*"+isbn:"+e+*/"&key="+key+"";
  
  var json = JSON.parse(UrlFetchApp.fetch(query_line));
//  Logger.log(json.totalItems);
  
  try {
    var item = json.items[0];
    var book = item.volumeInfo;
    //    var book = JSON.parse(UrlFetchApp.fetch("https://www.googleapis.com/books/v1/volumes/"+item.id)).volumeInfo;
  } catch (TypeError) {
    Logger.log("ISBN not found.");
    return null;
  }
  var data = {
    gbid: item.id,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    category: book.mainCategory,
    //    category: book.mainCategor,
    description: book.description,
    isbn: [],
    pages: book.pageCount,
    language: book.language,
    cover: book.imageLinks
  };
  if (!book.mainCategory && book.categories) {
    data.category = book.categories[0];
  }
  //  if (data.description) {
  //    data.description = data.description.replace(/<\S+>/g," "); 
  //  }
  if (book.industryIdentifiers) {
    for (var i = 0 ; i < book.industryIdentifiers.length ; i++) {
//      if (book.industryIdentifiers[i].type == "ISBN_13") {
//        data.isbn = book.industryIdentifiers[i].identifier;
      data.isbn,push(book.industryIdentifiers[i].identifier);
//      }
    }
  }
  //  Logger.log(data);
//  Logger.log(json);
  return data;
}


function getByGBId(id) {
  
  var getUrl = "https://www.googleapis.com/books/v1/volumes/"+id;
  
  var json = UrlFetchApp.fetch(getUrl);
  
  try {
    var item = JSON.parse(json);
    var book = item.volumeInfo;
  } catch (TypeError) {
    Logger.log("ISBN not found.");
    return {};
  }
  
  var data = {
    gbid: item.id,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    //    categories: book.mainCategory.split(" / "),
    //    category: book.categories[0],
    description: book.description,
    pages: book.pageCount,
    language: book.language,
    cover: book.imageLinks,
    isbn: []
  };
  if (book.industryIdentifiers) {
    for (var i = 0 ; i < book.industryIdentifiers.length ; i++) {
      data.isbn.push(book.industryIdentifiers[i].identifier);
    }
  }
  return data;
}



function test(){
  Logger.log("start test");
  var data = queryMulti("nation");
//  Logger.log(data);
  for (var i = 0 ; i < data.length ; i++) { Logger.log(data[i].title); }
  return data;
}
