/** WARNING - this code is not yet converted to use Parse.com **/

function notify() {
  var db = ScriptDb.getMyDb();
  
  var users = PropertiesService.getScriptProperties().getProperty("users-to-notify");
  if (!users) {
    PropertiesService.getScriptProperties().setProperty("users-to-notify", db.save({type: "list#users-to-notify", list: [], lastDate: (new Date()).getTime()}).getId());
    var users = PropertiesService.getScriptProperties().getProperty("users-to-notify");
  }
  users = db.load(users);
  Logger.log(users);
  for (var i = 0 ; i < users.list.length ; i++) {
    var user = db.load(users.list[i]);
    
    var html = HtmlService.createTemplateFromFile("newbooks");
    //  html.category = category;
    
    if (db.query({type: "book#generic", date: db.greaterThan(users.lastDate)}).getSize() > 0) {
      
      html.lastDate = users.lastDate;
      //  html.lastDate = 0;
      
      var message = {
        to: user.owner,
        name: "ספרות זולה",
        replyTo: "kehilat.gvanim@gmail.com",
        subject: "ספרים חדשים שהוספו למדף הספרים שלנו",
        htmlBody: html.evaluate().getContent()
      }
      
      MailApp.sendEmail(message);
    }
    
    
    users.lastDate = (new Date()).getTime();
    db.save(users);
  }
}

function subscribe() {
  var user = getUser();
  var db = ScriptDb.getMyDb();
  
  var users = PropertiesService.getScriptProperties().getProperty("users-to-notify");
  if (!users) {
    PropertiesService.getScriptProperties().setProperty("users-to-notify", db.save({type: "list#users-to-notify", list: [], lastDate: (new Date()).getTime()}).getId());
    var users = PropertiesService.getScriptProperties().getProperty("users-to-notify");
  }
  
  users = db.load(users);  
  
  for (var i = 0 ; i < users.list.length ; i++) {
    if (users.list[i] == user.getId()) {
      return 0;
    }
  }
  users.list.push(user.getId());
  db.save(users);
  Logger.log(users.list);
  return 1;
}

function unsubscribe() {
  var user = getUser();
  var db = ScriptDb.getMyDb();
  
  var users = PropertiesService.getScriptProperties().getProperty("users-to-notify");
  if (!users) {
    return 0;
  }
  
  users = db.load(users);  
  
  for (var i = 0 ; i < users.list.length ; i++) {
    if (users.list[i] == user.getId()) {
      var tmp = users.list[0];
      users.list[0] = users.list[i];
      users.list[i] = tmp;
      users.list.shift();
      db.save(users);
      Logger.log(users.list);
      return 1;
    }
  }
  return 0;
}


function isSubscribed() {
  var user = getUser();
  var db = ScriptDb.getMyDb();
  
  var users = PropertiesService.getScriptProperties().getProperty("users-to-notify");
  if (!users) {
    return 0;
  }
  
  users = db.load(users);  
  
  for (var i = 0 ; i < users.list.length ; i++) {
    if (users.list[i] == user.getId()) {
      return 1;
    }
  }
  return 0;
}


function deleteNotifications() {
  if (PropertiesService.getScriptProperties().getProperty("users-to-notify")) {
    var db = ScriptDb.getMyDb();
    var users = db.load(PropertiesService.getScriptProperties().getProperty("users-to-notify"));
    db.remove(users);
    PropertiesService.getScriptProperties().deleteProperty("users-to-notify");
  }
}
