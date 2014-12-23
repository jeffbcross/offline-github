goog.provide('github.db.row.Commits');
goog.provide('github.db.row.CommitsDbType');
goog.provide('github.db.row.CommitsType');
goog.provide('github.db.row.Issues');
goog.provide('github.db.row.IssuesDbType');
goog.provide('github.db.row.IssuesType');
goog.provide('github.db.row.Milestones');
goog.provide('github.db.row.MilestonesDbType');
goog.provide('github.db.row.MilestonesType');
goog.provide('github.db.row.PullRequests');
goog.provide('github.db.row.PullRequestsDbType');
goog.provide('github.db.row.PullRequestsType');
goog.provide('github.db.row.Users');
goog.provide('github.db.row.UsersDbType');
goog.provide('github.db.row.UsersType');
goog.provide('github.db.schema.Commits');
goog.provide('github.db.schema.Database');
goog.provide('github.db.schema.Issues');
goog.provide('github.db.schema.Milestones');
goog.provide('github.db.schema.PullRequests');
goog.provide('github.db.schema.Users');

goog.require('lf.Row');
goog.require('lf.Type');
goog.require('lf.schema.BaseColumn');
goog.require('lf.schema.Constraint');
goog.require('lf.schema.Database');
goog.require('lf.schema.Index');
goog.require('lf.schema.Table');



/**
 * @implements {lf.schema.Database}
 * @constructor
 */
github.db.schema.Database = function() {
  /** @private {!github.db.schema.Issues} */
  this.issues_ = new github.db.schema.Issues();

  /** @private {!github.db.schema.Users} */
  this.users_ = new github.db.schema.Users();

  /** @private {!github.db.schema.Milestones} */
  this.milestones_ = new github.db.schema.Milestones();

  /** @private {!github.db.schema.PullRequests} */
  this.pullRequests_ = new github.db.schema.PullRequests();

  /** @private {!github.db.schema.Commits} */
  this.commits_ = new github.db.schema.Commits();

};


/** @override */
github.db.schema.Database.prototype.getName = function() {
  return 'github';
};


/** @override */
github.db.schema.Database.prototype.getVersion = function() {
  return 1;
};


/** @override */
github.db.schema.Database.prototype.getTables = function() {
  return [
    this.issues_,
    this.users_,
    this.milestones_,
    this.pullRequests_,
    this.commits_
  ];
};


/** @return {!github.db.schema.Issues} */
github.db.schema.Database.prototype.getIssues = function() {
  return this.issues_;
};


/** @return {!github.db.schema.Users} */
github.db.schema.Database.prototype.getUsers = function() {
  return this.users_;
};


/** @return {!github.db.schema.Milestones} */
github.db.schema.Database.prototype.getMilestones = function() {
  return this.milestones_;
};


/** @return {!github.db.schema.PullRequests} */
github.db.schema.Database.prototype.getPullRequests = function() {
  return this.pullRequests_;
};


/** @return {!github.db.schema.Commits} */
github.db.schema.Database.prototype.getCommits = function() {
  return this.commits_;
};



/**
 * @extends {lf.schema.Table.<!github.db.row.IssuesType,
 *     !github.db.row.IssuesDbType>}
 * @constructor
 */
github.db.schema.Issues = function() {
  var cols = [];

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.id = new lf.schema.BaseColumn(
      this, 'id', true, lf.Type.STRING);
  cols.push(this.id);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.url = new lf.schema.BaseColumn(
      this, 'url', false, lf.Type.STRING);
  cols.push(this.url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.html_url = new lf.schema.BaseColumn(
      this, 'html_url', false, lf.Type.STRING);
  cols.push(this.html_url);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.number = new lf.schema.BaseColumn(
      this, 'number', false, lf.Type.INTEGER);
  cols.push(this.number);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.state = new lf.schema.BaseColumn(
      this, 'state', false, lf.Type.STRING);
  cols.push(this.state);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.title = new lf.schema.BaseColumn(
      this, 'title', false, lf.Type.STRING);
  cols.push(this.title);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.body = new lf.schema.BaseColumn(
      this, 'body', false, lf.Type.STRING);
  cols.push(this.body);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.user = new lf.schema.BaseColumn(
      this, 'user', false, lf.Type.INTEGER);
  cols.push(this.user);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.assignee = new lf.schema.BaseColumn(
      this, 'assignee', false, lf.Type.INTEGER);
  cols.push(this.assignee);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.milestone = new lf.schema.BaseColumn(
      this, 'milestone', false, lf.Type.INTEGER);
  cols.push(this.milestone);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.comments = new lf.schema.BaseColumn(
      this, 'comments', false, lf.Type.INTEGER);
  cols.push(this.comments);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.pull_request = new lf.schema.BaseColumn(
      this, 'pull_request', false, lf.Type.INTEGER);
  cols.push(this.pull_request);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.closed_at = new lf.schema.BaseColumn(
      this, 'closed_at', false, lf.Type.DATE_TIME);
  cols.push(this.closed_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.created_at = new lf.schema.BaseColumn(
      this, 'created_at', false, lf.Type.DATE_TIME);
  cols.push(this.created_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.updated_at = new lf.schema.BaseColumn(
      this, 'updated_at', false, lf.Type.DATE_TIME);
  cols.push(this.updated_at);

  var indices = [
    new lf.schema.Index('Issues', 'pkIssues', true, ['id'])
  ];

  github.db.schema.Issues.base(
      this, 'constructor', 'Issues', cols, indices, false);
};
goog.inherits(github.db.schema.Issues, lf.schema.Table);


/** @override */
github.db.schema.Issues.prototype.createRow = function(opt_value) {
  return new github.db.row.Issues(lf.Row.getNextId(), opt_value);
};


/** @override */
github.db.schema.Issues.prototype.deserializeRow = function(dbRecord) {
  var data = dbRecord['value'];
  var payload = new github.db.row.IssuesType();
  payload.id = data.id;
  payload.url = data.url;
  payload.html_url = data.html_url;
  payload.number = data.number;
  payload.state = data.state;
  payload.title = data.title;
  payload.body = data.body;
  payload.user = data.user;
  payload.assignee = data.assignee;
  payload.milestone = data.milestone;
  payload.comments = data.comments;
  payload.pull_request = data.pull_request;
  payload.closed_at = goog.isNull(data.closed_at) ?
      null : new Date(data.closed_at);
  payload.created_at = new Date(data.created_at);
  payload.updated_at = new Date(data.updated_at);
  return new github.db.row.Issues(dbRecord['id'], payload);
};


/** @override */
github.db.schema.Issues.prototype.getConstraint = function() {
  var pk = new lf.schema.Index('Issues', 'pkIssues', true, ['id']);
  var notNullable = [
    this.id,
    this.url,
    this.html_url,
    this.number,
    this.state,
    this.title,
    this.body,
    this.user,
    this.assignee,
    this.milestone,
    this.comments,
    this.pull_request,
    this.created_at,
    this.updated_at
  ];
  var foreignKeys = [];
  var unique = [
  ];
  return new lf.schema.Constraint(pk, notNullable, foreignKeys, unique);
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.IssuesType = function() {
  /** @export @type {string} */
  this.id;
  /** @export @type {string} */
  this.url;
  /** @export @type {string} */
  this.html_url;
  /** @export @type {number} */
  this.number;
  /** @export @type {string} */
  this.state;
  /** @export @type {string} */
  this.title;
  /** @export @type {string} */
  this.body;
  /** @export @type {number} */
  this.user;
  /** @export @type {number} */
  this.assignee;
  /** @export @type {number} */
  this.milestone;
  /** @export @type {number} */
  this.comments;
  /** @export @type {number} */
  this.pull_request;
  /** @export @type {?Date} */
  this.closed_at;
  /** @export @type {!Date} */
  this.created_at;
  /** @export @type {!Date} */
  this.updated_at;
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.IssuesDbType = function() {
  /** @export @type {string} */
  this.id;
  /** @export @type {string} */
  this.url;
  /** @export @type {string} */
  this.html_url;
  /** @export @type {number} */
  this.number;
  /** @export @type {string} */
  this.state;
  /** @export @type {string} */
  this.title;
  /** @export @type {string} */
  this.body;
  /** @export @type {number} */
  this.user;
  /** @export @type {number} */
  this.assignee;
  /** @export @type {number} */
  this.milestone;
  /** @export @type {number} */
  this.comments;
  /** @export @type {number} */
  this.pull_request;
  /** @export @type {?number} */
  this.closed_at;
  /** @export @type {number} */
  this.created_at;
  /** @export @type {number} */
  this.updated_at;
};



/**
 * Constructs a new Issues row.
 * @constructor
 * @extends {lf.Row.<!github.db.row.IssuesType,
 *     !github.db.row.IssuesDbType>}
 *
 * @param {number} rowId The row ID.
 * @param {!github.db.row.IssuesType=} opt_payload
 */
github.db.row.Issues = function(rowId, opt_payload) {
  github.db.row.Issues.base(this, 'constructor', rowId, opt_payload);
};
goog.inherits(github.db.row.Issues, lf.Row);


/** @override */
github.db.row.Issues.prototype.defaultPayload = function() {
  var payload = new github.db.row.IssuesType();
  payload.id = '';
  payload.url = '';
  payload.html_url = '';
  payload.number = 0;
  payload.state = '';
  payload.title = '';
  payload.body = '';
  payload.user = 0;
  payload.assignee = 0;
  payload.milestone = 0;
  payload.comments = 0;
  payload.pull_request = 0;
  payload.closed_at = null;
  payload.created_at = new Date(0);
  payload.updated_at = new Date(0);
  return payload;
};


/** @override */
github.db.row.Issues.prototype.toDbPayload = function() {
  var payload = new github.db.row.IssuesDbType();
  payload.id = this.payload().id;
  payload.url = this.payload().url;
  payload.html_url = this.payload().html_url;
  payload.number = this.payload().number;
  payload.state = this.payload().state;
  payload.title = this.payload().title;
  payload.body = this.payload().body;
  payload.user = this.payload().user;
  payload.assignee = this.payload().assignee;
  payload.milestone = this.payload().milestone;
  payload.comments = this.payload().comments;
  payload.pull_request = this.payload().pull_request;
  payload.closed_at = goog.isNull(this.payload().closed_at) ?
      null : this.payload().closed_at.getTime();
  payload.created_at = this.payload().created_at.getTime();
  payload.updated_at = this.payload().updated_at.getTime();
  return payload;
};


/** @override */
github.db.row.Issues.prototype.keyOfIndex = function(indexName) {
  switch (indexName) {
    case 'Issues.pkIssues':
      return this.payload().id;
    case 'Issues.#':
      return this.id();
    default:
      break;
  }
  return null;
};


/** @return {string} */
github.db.row.Issues.prototype.getId = function() {
  return this.payload().id;
};


/**
 * @param {string} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setId = function(value) {
  this.payload().id = value;
  return this;
};


/** @return {string} */
github.db.row.Issues.prototype.getUrl = function() {
  return this.payload().url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setUrl = function(value) {
  this.payload().url = value;
  return this;
};


/** @return {string} */
github.db.row.Issues.prototype.getHtml_url = function() {
  return this.payload().html_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setHtml_url = function(value) {
  this.payload().html_url = value;
  return this;
};


/** @return {number} */
github.db.row.Issues.prototype.getNumber = function() {
  return this.payload().number;
};


/**
 * @param {number} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setNumber = function(value) {
  this.payload().number = value;
  return this;
};


/** @return {string} */
github.db.row.Issues.prototype.getState = function() {
  return this.payload().state;
};


/**
 * @param {string} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setState = function(value) {
  this.payload().state = value;
  return this;
};


/** @return {string} */
github.db.row.Issues.prototype.getTitle = function() {
  return this.payload().title;
};


/**
 * @param {string} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setTitle = function(value) {
  this.payload().title = value;
  return this;
};


/** @return {string} */
github.db.row.Issues.prototype.getBody = function() {
  return this.payload().body;
};


/**
 * @param {string} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setBody = function(value) {
  this.payload().body = value;
  return this;
};


/** @return {number} */
github.db.row.Issues.prototype.getUser = function() {
  return this.payload().user;
};


/**
 * @param {number} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setUser = function(value) {
  this.payload().user = value;
  return this;
};


/** @return {number} */
github.db.row.Issues.prototype.getAssignee = function() {
  return this.payload().assignee;
};


/**
 * @param {number} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setAssignee = function(value) {
  this.payload().assignee = value;
  return this;
};


/** @return {number} */
github.db.row.Issues.prototype.getMilestone = function() {
  return this.payload().milestone;
};


/**
 * @param {number} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setMilestone = function(value) {
  this.payload().milestone = value;
  return this;
};


/** @return {number} */
github.db.row.Issues.prototype.getComments = function() {
  return this.payload().comments;
};


/**
 * @param {number} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setComments = function(value) {
  this.payload().comments = value;
  return this;
};


/** @return {number} */
github.db.row.Issues.prototype.getPull_request = function() {
  return this.payload().pull_request;
};


/**
 * @param {number} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setPull_request = function(value) {
  this.payload().pull_request = value;
  return this;
};


/** @return {?Date} */
github.db.row.Issues.prototype.getClosed_at = function() {
  return this.payload().closed_at;
};


/**
 * @param {?Date} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setClosed_at = function(value) {
  this.payload().closed_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.Issues.prototype.getCreated_at = function() {
  return this.payload().created_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setCreated_at = function(value) {
  this.payload().created_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.Issues.prototype.getUpdated_at = function() {
  return this.payload().updated_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.Issues}
*/
github.db.row.Issues.prototype.setUpdated_at = function(value) {
  this.payload().updated_at = value;
  return this;
};



/**
 * @extends {lf.schema.Table.<!github.db.row.UsersType,
 *     !github.db.row.UsersDbType>}
 * @constructor
 */
github.db.schema.Users = function() {
  var cols = [];

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.login = new lf.schema.BaseColumn(
      this, 'login', false, lf.Type.STRING);
  cols.push(this.login);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.id = new lf.schema.BaseColumn(
      this, 'id', true, lf.Type.INTEGER);
  cols.push(this.id);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.avatar_url = new lf.schema.BaseColumn(
      this, 'avatar_url', false, lf.Type.STRING);
  cols.push(this.avatar_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.gravatar_id = new lf.schema.BaseColumn(
      this, 'gravatar_id', false, lf.Type.STRING);
  cols.push(this.gravatar_id);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.url = new lf.schema.BaseColumn(
      this, 'url', false, lf.Type.STRING);
  cols.push(this.url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.html_url = new lf.schema.BaseColumn(
      this, 'html_url', false, lf.Type.STRING);
  cols.push(this.html_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.followers_url = new lf.schema.BaseColumn(
      this, 'followers_url', false, lf.Type.STRING);
  cols.push(this.followers_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.following_url = new lf.schema.BaseColumn(
      this, 'following_url', false, lf.Type.STRING);
  cols.push(this.following_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.gists_url = new lf.schema.BaseColumn(
      this, 'gists_url', false, lf.Type.STRING);
  cols.push(this.gists_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.starred_url = new lf.schema.BaseColumn(
      this, 'starred_url', false, lf.Type.STRING);
  cols.push(this.starred_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.subscriptions_url = new lf.schema.BaseColumn(
      this, 'subscriptions_url', false, lf.Type.STRING);
  cols.push(this.subscriptions_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.organizations_url = new lf.schema.BaseColumn(
      this, 'organizations_url', false, lf.Type.STRING);
  cols.push(this.organizations_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.repos_url = new lf.schema.BaseColumn(
      this, 'repos_url', false, lf.Type.STRING);
  cols.push(this.repos_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.events_url = new lf.schema.BaseColumn(
      this, 'events_url', false, lf.Type.STRING);
  cols.push(this.events_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.received_events_url = new lf.schema.BaseColumn(
      this, 'received_events_url', false, lf.Type.STRING);
  cols.push(this.received_events_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.type = new lf.schema.BaseColumn(
      this, 'type', false, lf.Type.STRING);
  cols.push(this.type);

  /** @type {!lf.schema.BaseColumn.<boolean>} */
  this.site_admin = new lf.schema.BaseColumn(
      this, 'site_admin', false, lf.Type.BOOLEAN);
  cols.push(this.site_admin);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.name = new lf.schema.BaseColumn(
      this, 'name', false, lf.Type.STRING);
  cols.push(this.name);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.company = new lf.schema.BaseColumn(
      this, 'company', false, lf.Type.STRING);
  cols.push(this.company);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.blog = new lf.schema.BaseColumn(
      this, 'blog', false, lf.Type.STRING);
  cols.push(this.blog);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.location = new lf.schema.BaseColumn(
      this, 'location', false, lf.Type.STRING);
  cols.push(this.location);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.email = new lf.schema.BaseColumn(
      this, 'email', false, lf.Type.STRING);
  cols.push(this.email);

  /** @type {!lf.schema.BaseColumn.<boolean>} */
  this.hireable = new lf.schema.BaseColumn(
      this, 'hireable', false, lf.Type.BOOLEAN);
  cols.push(this.hireable);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.bio = new lf.schema.BaseColumn(
      this, 'bio', false, lf.Type.STRING);
  cols.push(this.bio);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.public_repos = new lf.schema.BaseColumn(
      this, 'public_repos', false, lf.Type.INTEGER);
  cols.push(this.public_repos);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.public_gists = new lf.schema.BaseColumn(
      this, 'public_gists', false, lf.Type.INTEGER);
  cols.push(this.public_gists);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.followers = new lf.schema.BaseColumn(
      this, 'followers', false, lf.Type.INTEGER);
  cols.push(this.followers);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.following = new lf.schema.BaseColumn(
      this, 'following', false, lf.Type.INTEGER);
  cols.push(this.following);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.created_at = new lf.schema.BaseColumn(
      this, 'created_at', false, lf.Type.DATE_TIME);
  cols.push(this.created_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.updated_at = new lf.schema.BaseColumn(
      this, 'updated_at', false, lf.Type.DATE_TIME);
  cols.push(this.updated_at);

  var indices = [
    new lf.schema.Index('Users', 'pkUsers', true, ['id'])
  ];

  github.db.schema.Users.base(
      this, 'constructor', 'Users', cols, indices, false);
};
goog.inherits(github.db.schema.Users, lf.schema.Table);


/** @override */
github.db.schema.Users.prototype.createRow = function(opt_value) {
  return new github.db.row.Users(lf.Row.getNextId(), opt_value);
};


/** @override */
github.db.schema.Users.prototype.deserializeRow = function(dbRecord) {
  var data = dbRecord['value'];
  var payload = new github.db.row.UsersType();
  payload.login = data.login;
  payload.id = data.id;
  payload.avatar_url = data.avatar_url;
  payload.gravatar_id = data.gravatar_id;
  payload.url = data.url;
  payload.html_url = data.html_url;
  payload.followers_url = data.followers_url;
  payload.following_url = data.following_url;
  payload.gists_url = data.gists_url;
  payload.starred_url = data.starred_url;
  payload.subscriptions_url = data.subscriptions_url;
  payload.organizations_url = data.organizations_url;
  payload.repos_url = data.repos_url;
  payload.events_url = data.events_url;
  payload.received_events_url = data.received_events_url;
  payload.type = data.type;
  payload.site_admin = data.site_admin;
  payload.name = data.name;
  payload.company = data.company;
  payload.blog = data.blog;
  payload.location = data.location;
  payload.email = data.email;
  payload.hireable = data.hireable;
  payload.bio = data.bio;
  payload.public_repos = data.public_repos;
  payload.public_gists = data.public_gists;
  payload.followers = data.followers;
  payload.following = data.following;
  payload.created_at = goog.isNull(data.created_at) ?
      null : new Date(data.created_at);
  payload.updated_at = goog.isNull(data.updated_at) ?
      null : new Date(data.updated_at);
  return new github.db.row.Users(dbRecord['id'], payload);
};


/** @override */
github.db.schema.Users.prototype.getConstraint = function() {
  var pk = new lf.schema.Index('Users', 'pkUsers', true, ['id']);
  var notNullable = [
    this.login,
    this.id,
    this.avatar_url,
    this.gravatar_id,
    this.url,
    this.html_url,
    this.followers_url,
    this.following_url,
    this.gists_url,
    this.starred_url,
    this.subscriptions_url,
    this.organizations_url,
    this.repos_url,
    this.events_url,
    this.received_events_url,
    this.type,
    this.site_admin,
    this.hireable,
    this.public_repos,
    this.public_gists,
    this.followers,
    this.following
  ];
  var foreignKeys = [];
  var unique = [
  ];
  return new lf.schema.Constraint(pk, notNullable, foreignKeys, unique);
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.UsersType = function() {
  /** @export @type {string} */
  this.login;
  /** @export @type {number} */
  this.id;
  /** @export @type {string} */
  this.avatar_url;
  /** @export @type {string} */
  this.gravatar_id;
  /** @export @type {string} */
  this.url;
  /** @export @type {string} */
  this.html_url;
  /** @export @type {string} */
  this.followers_url;
  /** @export @type {string} */
  this.following_url;
  /** @export @type {string} */
  this.gists_url;
  /** @export @type {string} */
  this.starred_url;
  /** @export @type {string} */
  this.subscriptions_url;
  /** @export @type {string} */
  this.organizations_url;
  /** @export @type {string} */
  this.repos_url;
  /** @export @type {string} */
  this.events_url;
  /** @export @type {string} */
  this.received_events_url;
  /** @export @type {string} */
  this.type;
  /** @export @type {boolean} */
  this.site_admin;
  /** @export @type {?string} */
  this.name;
  /** @export @type {?string} */
  this.company;
  /** @export @type {?string} */
  this.blog;
  /** @export @type {?string} */
  this.location;
  /** @export @type {?string} */
  this.email;
  /** @export @type {boolean} */
  this.hireable;
  /** @export @type {?string} */
  this.bio;
  /** @export @type {number} */
  this.public_repos;
  /** @export @type {number} */
  this.public_gists;
  /** @export @type {number} */
  this.followers;
  /** @export @type {number} */
  this.following;
  /** @export @type {?Date} */
  this.created_at;
  /** @export @type {?Date} */
  this.updated_at;
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.UsersDbType = function() {
  /** @export @type {string} */
  this.login;
  /** @export @type {number} */
  this.id;
  /** @export @type {string} */
  this.avatar_url;
  /** @export @type {string} */
  this.gravatar_id;
  /** @export @type {string} */
  this.url;
  /** @export @type {string} */
  this.html_url;
  /** @export @type {string} */
  this.followers_url;
  /** @export @type {string} */
  this.following_url;
  /** @export @type {string} */
  this.gists_url;
  /** @export @type {string} */
  this.starred_url;
  /** @export @type {string} */
  this.subscriptions_url;
  /** @export @type {string} */
  this.organizations_url;
  /** @export @type {string} */
  this.repos_url;
  /** @export @type {string} */
  this.events_url;
  /** @export @type {string} */
  this.received_events_url;
  /** @export @type {string} */
  this.type;
  /** @export @type {boolean} */
  this.site_admin;
  /** @export @type {?string} */
  this.name;
  /** @export @type {?string} */
  this.company;
  /** @export @type {?string} */
  this.blog;
  /** @export @type {?string} */
  this.location;
  /** @export @type {?string} */
  this.email;
  /** @export @type {boolean} */
  this.hireable;
  /** @export @type {?string} */
  this.bio;
  /** @export @type {number} */
  this.public_repos;
  /** @export @type {number} */
  this.public_gists;
  /** @export @type {number} */
  this.followers;
  /** @export @type {number} */
  this.following;
  /** @export @type {?number} */
  this.created_at;
  /** @export @type {?number} */
  this.updated_at;
};



/**
 * Constructs a new Users row.
 * @constructor
 * @extends {lf.Row.<!github.db.row.UsersType,
 *     !github.db.row.UsersDbType>}
 *
 * @param {number} rowId The row ID.
 * @param {!github.db.row.UsersType=} opt_payload
 */
github.db.row.Users = function(rowId, opt_payload) {
  github.db.row.Users.base(this, 'constructor', rowId, opt_payload);
};
goog.inherits(github.db.row.Users, lf.Row);


/** @override */
github.db.row.Users.prototype.defaultPayload = function() {
  var payload = new github.db.row.UsersType();
  payload.login = '';
  payload.id = 0;
  payload.avatar_url = '';
  payload.gravatar_id = '';
  payload.url = '';
  payload.html_url = '';
  payload.followers_url = '';
  payload.following_url = '';
  payload.gists_url = '';
  payload.starred_url = '';
  payload.subscriptions_url = '';
  payload.organizations_url = '';
  payload.repos_url = '';
  payload.events_url = '';
  payload.received_events_url = '';
  payload.type = '';
  payload.site_admin = false;
  payload.name = null;
  payload.company = null;
  payload.blog = null;
  payload.location = null;
  payload.email = null;
  payload.hireable = false;
  payload.bio = null;
  payload.public_repos = 0;
  payload.public_gists = 0;
  payload.followers = 0;
  payload.following = 0;
  payload.created_at = null;
  payload.updated_at = null;
  return payload;
};


/** @override */
github.db.row.Users.prototype.toDbPayload = function() {
  var payload = new github.db.row.UsersDbType();
  payload.login = this.payload().login;
  payload.id = this.payload().id;
  payload.avatar_url = this.payload().avatar_url;
  payload.gravatar_id = this.payload().gravatar_id;
  payload.url = this.payload().url;
  payload.html_url = this.payload().html_url;
  payload.followers_url = this.payload().followers_url;
  payload.following_url = this.payload().following_url;
  payload.gists_url = this.payload().gists_url;
  payload.starred_url = this.payload().starred_url;
  payload.subscriptions_url = this.payload().subscriptions_url;
  payload.organizations_url = this.payload().organizations_url;
  payload.repos_url = this.payload().repos_url;
  payload.events_url = this.payload().events_url;
  payload.received_events_url = this.payload().received_events_url;
  payload.type = this.payload().type;
  payload.site_admin = this.payload().site_admin;
  payload.name = this.payload().name;
  payload.company = this.payload().company;
  payload.blog = this.payload().blog;
  payload.location = this.payload().location;
  payload.email = this.payload().email;
  payload.hireable = this.payload().hireable;
  payload.bio = this.payload().bio;
  payload.public_repos = this.payload().public_repos;
  payload.public_gists = this.payload().public_gists;
  payload.followers = this.payload().followers;
  payload.following = this.payload().following;
  payload.created_at = goog.isNull(this.payload().created_at) ?
      null : this.payload().created_at.getTime();
  payload.updated_at = goog.isNull(this.payload().updated_at) ?
      null : this.payload().updated_at.getTime();
  return payload;
};


/** @override */
github.db.row.Users.prototype.keyOfIndex = function(indexName) {
  switch (indexName) {
    case 'Users.pkUsers':
      return this.payload().id;
    case 'Users.#':
      return this.id();
    default:
      break;
  }
  return null;
};


/** @return {string} */
github.db.row.Users.prototype.getLogin = function() {
  return this.payload().login;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setLogin = function(value) {
  this.payload().login = value;
  return this;
};


/** @return {number} */
github.db.row.Users.prototype.getId = function() {
  return this.payload().id;
};


/**
 * @param {number} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setId = function(value) {
  this.payload().id = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getAvatar_url = function() {
  return this.payload().avatar_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setAvatar_url = function(value) {
  this.payload().avatar_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getGravatar_id = function() {
  return this.payload().gravatar_id;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setGravatar_id = function(value) {
  this.payload().gravatar_id = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getUrl = function() {
  return this.payload().url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setUrl = function(value) {
  this.payload().url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getHtml_url = function() {
  return this.payload().html_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setHtml_url = function(value) {
  this.payload().html_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getFollowers_url = function() {
  return this.payload().followers_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setFollowers_url = function(value) {
  this.payload().followers_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getFollowing_url = function() {
  return this.payload().following_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setFollowing_url = function(value) {
  this.payload().following_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getGists_url = function() {
  return this.payload().gists_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setGists_url = function(value) {
  this.payload().gists_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getStarred_url = function() {
  return this.payload().starred_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setStarred_url = function(value) {
  this.payload().starred_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getSubscriptions_url = function() {
  return this.payload().subscriptions_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setSubscriptions_url = function(value) {
  this.payload().subscriptions_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getOrganizations_url = function() {
  return this.payload().organizations_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setOrganizations_url = function(value) {
  this.payload().organizations_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getRepos_url = function() {
  return this.payload().repos_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setRepos_url = function(value) {
  this.payload().repos_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getEvents_url = function() {
  return this.payload().events_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setEvents_url = function(value) {
  this.payload().events_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getReceived_events_url = function() {
  return this.payload().received_events_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setReceived_events_url = function(value) {
  this.payload().received_events_url = value;
  return this;
};


/** @return {string} */
github.db.row.Users.prototype.getType = function() {
  return this.payload().type;
};


/**
 * @param {string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setType = function(value) {
  this.payload().type = value;
  return this;
};


/** @return {boolean} */
github.db.row.Users.prototype.getSite_admin = function() {
  return this.payload().site_admin;
};


/**
 * @param {boolean} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setSite_admin = function(value) {
  this.payload().site_admin = value;
  return this;
};


/** @return {?string} */
github.db.row.Users.prototype.getName = function() {
  return this.payload().name;
};


/**
 * @param {?string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setName = function(value) {
  this.payload().name = value;
  return this;
};


/** @return {?string} */
github.db.row.Users.prototype.getCompany = function() {
  return this.payload().company;
};


/**
 * @param {?string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setCompany = function(value) {
  this.payload().company = value;
  return this;
};


/** @return {?string} */
github.db.row.Users.prototype.getBlog = function() {
  return this.payload().blog;
};


/**
 * @param {?string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setBlog = function(value) {
  this.payload().blog = value;
  return this;
};


/** @return {?string} */
github.db.row.Users.prototype.getLocation = function() {
  return this.payload().location;
};


/**
 * @param {?string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setLocation = function(value) {
  this.payload().location = value;
  return this;
};


/** @return {?string} */
github.db.row.Users.prototype.getEmail = function() {
  return this.payload().email;
};


/**
 * @param {?string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setEmail = function(value) {
  this.payload().email = value;
  return this;
};


/** @return {boolean} */
github.db.row.Users.prototype.getHireable = function() {
  return this.payload().hireable;
};


/**
 * @param {boolean} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setHireable = function(value) {
  this.payload().hireable = value;
  return this;
};


/** @return {?string} */
github.db.row.Users.prototype.getBio = function() {
  return this.payload().bio;
};


/**
 * @param {?string} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setBio = function(value) {
  this.payload().bio = value;
  return this;
};


/** @return {number} */
github.db.row.Users.prototype.getPublic_repos = function() {
  return this.payload().public_repos;
};


/**
 * @param {number} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setPublic_repos = function(value) {
  this.payload().public_repos = value;
  return this;
};


/** @return {number} */
github.db.row.Users.prototype.getPublic_gists = function() {
  return this.payload().public_gists;
};


/**
 * @param {number} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setPublic_gists = function(value) {
  this.payload().public_gists = value;
  return this;
};


/** @return {number} */
github.db.row.Users.prototype.getFollowers = function() {
  return this.payload().followers;
};


/**
 * @param {number} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setFollowers = function(value) {
  this.payload().followers = value;
  return this;
};


/** @return {number} */
github.db.row.Users.prototype.getFollowing = function() {
  return this.payload().following;
};


/**
 * @param {number} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setFollowing = function(value) {
  this.payload().following = value;
  return this;
};


/** @return {?Date} */
github.db.row.Users.prototype.getCreated_at = function() {
  return this.payload().created_at;
};


/**
 * @param {?Date} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setCreated_at = function(value) {
  this.payload().created_at = value;
  return this;
};


/** @return {?Date} */
github.db.row.Users.prototype.getUpdated_at = function() {
  return this.payload().updated_at;
};


/**
 * @param {?Date} value
 * @return {!github.db.row.Users}
*/
github.db.row.Users.prototype.setUpdated_at = function(value) {
  this.payload().updated_at = value;
  return this;
};



/**
 * @extends {lf.schema.Table.<!github.db.row.MilestonesType,
 *     !github.db.row.MilestonesDbType>}
 * @constructor
 */
github.db.schema.Milestones = function() {
  var cols = [];

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.url = new lf.schema.BaseColumn(
      this, 'url', false, lf.Type.STRING);
  cols.push(this.url);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.number = new lf.schema.BaseColumn(
      this, 'number', true, lf.Type.INTEGER);
  cols.push(this.number);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.state = new lf.schema.BaseColumn(
      this, 'state', false, lf.Type.STRING);
  cols.push(this.state);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.title = new lf.schema.BaseColumn(
      this, 'title', false, lf.Type.STRING);
  cols.push(this.title);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.description = new lf.schema.BaseColumn(
      this, 'description', false, lf.Type.STRING);
  cols.push(this.description);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.creator = new lf.schema.BaseColumn(
      this, 'creator', false, lf.Type.INTEGER);
  cols.push(this.creator);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.open_issues = new lf.schema.BaseColumn(
      this, 'open_issues', false, lf.Type.INTEGER);
  cols.push(this.open_issues);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.closed_issues = new lf.schema.BaseColumn(
      this, 'closed_issues', false, lf.Type.INTEGER);
  cols.push(this.closed_issues);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.created_at = new lf.schema.BaseColumn(
      this, 'created_at', false, lf.Type.DATE_TIME);
  cols.push(this.created_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.updated_at = new lf.schema.BaseColumn(
      this, 'updated_at', false, lf.Type.DATE_TIME);
  cols.push(this.updated_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.closed_at = new lf.schema.BaseColumn(
      this, 'closed_at', false, lf.Type.DATE_TIME);
  cols.push(this.closed_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.due_on = new lf.schema.BaseColumn(
      this, 'due_on', false, lf.Type.DATE_TIME);
  cols.push(this.due_on);

  var indices = [
    new lf.schema.Index('Milestones', 'pkMilestones', true, ['number'])
  ];

  github.db.schema.Milestones.base(
      this, 'constructor', 'Milestones', cols, indices, false);
};
goog.inherits(github.db.schema.Milestones, lf.schema.Table);


/** @override */
github.db.schema.Milestones.prototype.createRow = function(opt_value) {
  return new github.db.row.Milestones(lf.Row.getNextId(), opt_value);
};


/** @override */
github.db.schema.Milestones.prototype.deserializeRow = function(dbRecord) {
  var data = dbRecord['value'];
  var payload = new github.db.row.MilestonesType();
  payload.url = data.url;
  payload.number = data.number;
  payload.state = data.state;
  payload.title = data.title;
  payload.description = data.description;
  payload.creator = data.creator;
  payload.open_issues = data.open_issues;
  payload.closed_issues = data.closed_issues;
  payload.created_at = new Date(data.created_at);
  payload.updated_at = new Date(data.updated_at);
  payload.closed_at = new Date(data.closed_at);
  payload.due_on = goog.isNull(data.due_on) ?
      null : new Date(data.due_on);
  return new github.db.row.Milestones(dbRecord['id'], payload);
};


/** @override */
github.db.schema.Milestones.prototype.getConstraint = function() {
  var pk = new lf.schema.Index('Milestones', 'pkMilestones', true, ['number']);
  var notNullable = [
    this.url,
    this.number,
    this.state,
    this.title,
    this.description,
    this.creator,
    this.open_issues,
    this.closed_issues,
    this.created_at,
    this.updated_at,
    this.closed_at
  ];
  var foreignKeys = [];
  var unique = [
  ];
  return new lf.schema.Constraint(pk, notNullable, foreignKeys, unique);
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.MilestonesType = function() {
  /** @export @type {string} */
  this.url;
  /** @export @type {number} */
  this.number;
  /** @export @type {string} */
  this.state;
  /** @export @type {string} */
  this.title;
  /** @export @type {string} */
  this.description;
  /** @export @type {number} */
  this.creator;
  /** @export @type {number} */
  this.open_issues;
  /** @export @type {number} */
  this.closed_issues;
  /** @export @type {!Date} */
  this.created_at;
  /** @export @type {!Date} */
  this.updated_at;
  /** @export @type {!Date} */
  this.closed_at;
  /** @export @type {?Date} */
  this.due_on;
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.MilestonesDbType = function() {
  /** @export @type {string} */
  this.url;
  /** @export @type {number} */
  this.number;
  /** @export @type {string} */
  this.state;
  /** @export @type {string} */
  this.title;
  /** @export @type {string} */
  this.description;
  /** @export @type {number} */
  this.creator;
  /** @export @type {number} */
  this.open_issues;
  /** @export @type {number} */
  this.closed_issues;
  /** @export @type {number} */
  this.created_at;
  /** @export @type {number} */
  this.updated_at;
  /** @export @type {number} */
  this.closed_at;
  /** @export @type {?number} */
  this.due_on;
};



/**
 * Constructs a new Milestones row.
 * @constructor
 * @extends {lf.Row.<!github.db.row.MilestonesType,
 *     !github.db.row.MilestonesDbType>}
 *
 * @param {number} rowId The row ID.
 * @param {!github.db.row.MilestonesType=} opt_payload
 */
github.db.row.Milestones = function(rowId, opt_payload) {
  github.db.row.Milestones.base(this, 'constructor', rowId, opt_payload);
};
goog.inherits(github.db.row.Milestones, lf.Row);


/** @override */
github.db.row.Milestones.prototype.defaultPayload = function() {
  var payload = new github.db.row.MilestonesType();
  payload.url = '';
  payload.number = 0;
  payload.state = '';
  payload.title = '';
  payload.description = '';
  payload.creator = 0;
  payload.open_issues = 0;
  payload.closed_issues = 0;
  payload.created_at = new Date(0);
  payload.updated_at = new Date(0);
  payload.closed_at = new Date(0);
  payload.due_on = null;
  return payload;
};


/** @override */
github.db.row.Milestones.prototype.toDbPayload = function() {
  var payload = new github.db.row.MilestonesDbType();
  payload.url = this.payload().url;
  payload.number = this.payload().number;
  payload.state = this.payload().state;
  payload.title = this.payload().title;
  payload.description = this.payload().description;
  payload.creator = this.payload().creator;
  payload.open_issues = this.payload().open_issues;
  payload.closed_issues = this.payload().closed_issues;
  payload.created_at = this.payload().created_at.getTime();
  payload.updated_at = this.payload().updated_at.getTime();
  payload.closed_at = this.payload().closed_at.getTime();
  payload.due_on = goog.isNull(this.payload().due_on) ?
      null : this.payload().due_on.getTime();
  return payload;
};


/** @override */
github.db.row.Milestones.prototype.keyOfIndex = function(indexName) {
  switch (indexName) {
    case 'Milestones.pkMilestones':
      return this.payload().number;
    case 'Milestones.#':
      return this.id();
    default:
      break;
  }
  return null;
};


/** @return {string} */
github.db.row.Milestones.prototype.getUrl = function() {
  return this.payload().url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setUrl = function(value) {
  this.payload().url = value;
  return this;
};


/** @return {number} */
github.db.row.Milestones.prototype.getNumber = function() {
  return this.payload().number;
};


/**
 * @param {number} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setNumber = function(value) {
  this.payload().number = value;
  return this;
};


/** @return {string} */
github.db.row.Milestones.prototype.getState = function() {
  return this.payload().state;
};


/**
 * @param {string} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setState = function(value) {
  this.payload().state = value;
  return this;
};


/** @return {string} */
github.db.row.Milestones.prototype.getTitle = function() {
  return this.payload().title;
};


/**
 * @param {string} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setTitle = function(value) {
  this.payload().title = value;
  return this;
};


/** @return {string} */
github.db.row.Milestones.prototype.getDescription = function() {
  return this.payload().description;
};


/**
 * @param {string} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setDescription = function(value) {
  this.payload().description = value;
  return this;
};


/** @return {number} */
github.db.row.Milestones.prototype.getCreator = function() {
  return this.payload().creator;
};


/**
 * @param {number} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setCreator = function(value) {
  this.payload().creator = value;
  return this;
};


/** @return {number} */
github.db.row.Milestones.prototype.getOpen_issues = function() {
  return this.payload().open_issues;
};


/**
 * @param {number} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setOpen_issues = function(value) {
  this.payload().open_issues = value;
  return this;
};


/** @return {number} */
github.db.row.Milestones.prototype.getClosed_issues = function() {
  return this.payload().closed_issues;
};


/**
 * @param {number} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setClosed_issues = function(value) {
  this.payload().closed_issues = value;
  return this;
};


/** @return {!Date} */
github.db.row.Milestones.prototype.getCreated_at = function() {
  return this.payload().created_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setCreated_at = function(value) {
  this.payload().created_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.Milestones.prototype.getUpdated_at = function() {
  return this.payload().updated_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setUpdated_at = function(value) {
  this.payload().updated_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.Milestones.prototype.getClosed_at = function() {
  return this.payload().closed_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setClosed_at = function(value) {
  this.payload().closed_at = value;
  return this;
};


/** @return {?Date} */
github.db.row.Milestones.prototype.getDue_on = function() {
  return this.payload().due_on;
};


/**
 * @param {?Date} value
 * @return {!github.db.row.Milestones}
*/
github.db.row.Milestones.prototype.setDue_on = function(value) {
  this.payload().due_on = value;
  return this;
};



/**
 * @extends {lf.schema.Table.<!github.db.row.PullRequestsType,
 *     !github.db.row.PullRequestsDbType>}
 * @constructor
 */
github.db.schema.PullRequests = function() {
  var cols = [];

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.id = new lf.schema.BaseColumn(
      this, 'id', true, lf.Type.INTEGER);
  cols.push(this.id);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.url = new lf.schema.BaseColumn(
      this, 'url', false, lf.Type.STRING);
  cols.push(this.url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.html_url = new lf.schema.BaseColumn(
      this, 'html_url', false, lf.Type.STRING);
  cols.push(this.html_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.diff_url = new lf.schema.BaseColumn(
      this, 'diff_url', false, lf.Type.STRING);
  cols.push(this.diff_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.patch_url = new lf.schema.BaseColumn(
      this, 'patch_url', false, lf.Type.STRING);
  cols.push(this.patch_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.issue_url = new lf.schema.BaseColumn(
      this, 'issue_url', false, lf.Type.STRING);
  cols.push(this.issue_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.commits_url = new lf.schema.BaseColumn(
      this, 'commits_url', false, lf.Type.STRING);
  cols.push(this.commits_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.review_comments_url = new lf.schema.BaseColumn(
      this, 'review_comments_url', false, lf.Type.STRING);
  cols.push(this.review_comments_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.review_comment_url = new lf.schema.BaseColumn(
      this, 'review_comment_url', false, lf.Type.STRING);
  cols.push(this.review_comment_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.comments_url = new lf.schema.BaseColumn(
      this, 'comments_url', false, lf.Type.STRING);
  cols.push(this.comments_url);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.statuses_url = new lf.schema.BaseColumn(
      this, 'statuses_url', false, lf.Type.STRING);
  cols.push(this.statuses_url);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.number = new lf.schema.BaseColumn(
      this, 'number', false, lf.Type.INTEGER);
  cols.push(this.number);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.state = new lf.schema.BaseColumn(
      this, 'state', false, lf.Type.STRING);
  cols.push(this.state);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.title = new lf.schema.BaseColumn(
      this, 'title', false, lf.Type.STRING);
  cols.push(this.title);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.body = new lf.schema.BaseColumn(
      this, 'body', false, lf.Type.STRING);
  cols.push(this.body);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.created_at = new lf.schema.BaseColumn(
      this, 'created_at', false, lf.Type.DATE_TIME);
  cols.push(this.created_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.updated_at = new lf.schema.BaseColumn(
      this, 'updated_at', false, lf.Type.DATE_TIME);
  cols.push(this.updated_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.closed_at = new lf.schema.BaseColumn(
      this, 'closed_at', false, lf.Type.DATE_TIME);
  cols.push(this.closed_at);

  /** @type {!lf.schema.BaseColumn.<!Date>} */
  this.merged_at = new lf.schema.BaseColumn(
      this, 'merged_at', false, lf.Type.DATE_TIME);
  cols.push(this.merged_at);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.head = new lf.schema.BaseColumn(
      this, 'head', false, lf.Type.STRING);
  cols.push(this.head);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.base = new lf.schema.BaseColumn(
      this, 'base', false, lf.Type.STRING);
  cols.push(this.base);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.user = new lf.schema.BaseColumn(
      this, 'user', false, lf.Type.INTEGER);
  cols.push(this.user);

  var indices = [
    new lf.schema.Index('PullRequests', 'pkPullRequests', true, ['id'])
  ];

  github.db.schema.PullRequests.base(
      this, 'constructor', 'PullRequests', cols, indices, false);
};
goog.inherits(github.db.schema.PullRequests, lf.schema.Table);


/** @override */
github.db.schema.PullRequests.prototype.createRow = function(opt_value) {
  return new github.db.row.PullRequests(lf.Row.getNextId(), opt_value);
};


/** @override */
github.db.schema.PullRequests.prototype.deserializeRow = function(dbRecord) {
  var data = dbRecord['value'];
  var payload = new github.db.row.PullRequestsType();
  payload.id = data.id;
  payload.url = data.url;
  payload.html_url = data.html_url;
  payload.diff_url = data.diff_url;
  payload.patch_url = data.patch_url;
  payload.issue_url = data.issue_url;
  payload.commits_url = data.commits_url;
  payload.review_comments_url = data.review_comments_url;
  payload.review_comment_url = data.review_comment_url;
  payload.comments_url = data.comments_url;
  payload.statuses_url = data.statuses_url;
  payload.number = data.number;
  payload.state = data.state;
  payload.title = data.title;
  payload.body = data.body;
  payload.created_at = new Date(data.created_at);
  payload.updated_at = new Date(data.updated_at);
  payload.closed_at = new Date(data.closed_at);
  payload.merged_at = new Date(data.merged_at);
  payload.head = data.head;
  payload.base = data.base;
  payload.user = data.user;
  return new github.db.row.PullRequests(dbRecord['id'], payload);
};


/** @override */
github.db.schema.PullRequests.prototype.getConstraint = function() {
  var pk = new lf.schema.Index('PullRequests', 'pkPullRequests', true, ['id']);
  var notNullable = [
    this.id,
    this.url,
    this.html_url,
    this.diff_url,
    this.patch_url,
    this.issue_url,
    this.commits_url,
    this.review_comments_url,
    this.review_comment_url,
    this.comments_url,
    this.statuses_url,
    this.number,
    this.state,
    this.title,
    this.body,
    this.created_at,
    this.updated_at,
    this.closed_at,
    this.merged_at,
    this.head,
    this.base,
    this.user
  ];
  var foreignKeys = [];
  var unique = [
  ];
  return new lf.schema.Constraint(pk, notNullable, foreignKeys, unique);
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.PullRequestsType = function() {
  /** @export @type {number} */
  this.id;
  /** @export @type {string} */
  this.url;
  /** @export @type {string} */
  this.html_url;
  /** @export @type {string} */
  this.diff_url;
  /** @export @type {string} */
  this.patch_url;
  /** @export @type {string} */
  this.issue_url;
  /** @export @type {string} */
  this.commits_url;
  /** @export @type {string} */
  this.review_comments_url;
  /** @export @type {string} */
  this.review_comment_url;
  /** @export @type {string} */
  this.comments_url;
  /** @export @type {string} */
  this.statuses_url;
  /** @export @type {number} */
  this.number;
  /** @export @type {string} */
  this.state;
  /** @export @type {string} */
  this.title;
  /** @export @type {string} */
  this.body;
  /** @export @type {!Date} */
  this.created_at;
  /** @export @type {!Date} */
  this.updated_at;
  /** @export @type {!Date} */
  this.closed_at;
  /** @export @type {!Date} */
  this.merged_at;
  /** @export @type {string} */
  this.head;
  /** @export @type {string} */
  this.base;
  /** @export @type {number} */
  this.user;
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.PullRequestsDbType = function() {
  /** @export @type {number} */
  this.id;
  /** @export @type {string} */
  this.url;
  /** @export @type {string} */
  this.html_url;
  /** @export @type {string} */
  this.diff_url;
  /** @export @type {string} */
  this.patch_url;
  /** @export @type {string} */
  this.issue_url;
  /** @export @type {string} */
  this.commits_url;
  /** @export @type {string} */
  this.review_comments_url;
  /** @export @type {string} */
  this.review_comment_url;
  /** @export @type {string} */
  this.comments_url;
  /** @export @type {string} */
  this.statuses_url;
  /** @export @type {number} */
  this.number;
  /** @export @type {string} */
  this.state;
  /** @export @type {string} */
  this.title;
  /** @export @type {string} */
  this.body;
  /** @export @type {number} */
  this.created_at;
  /** @export @type {number} */
  this.updated_at;
  /** @export @type {number} */
  this.closed_at;
  /** @export @type {number} */
  this.merged_at;
  /** @export @type {string} */
  this.head;
  /** @export @type {string} */
  this.base;
  /** @export @type {number} */
  this.user;
};



/**
 * Constructs a new PullRequests row.
 * @constructor
 * @extends {lf.Row.<!github.db.row.PullRequestsType,
 *     !github.db.row.PullRequestsDbType>}
 *
 * @param {number} rowId The row ID.
 * @param {!github.db.row.PullRequestsType=} opt_payload
 */
github.db.row.PullRequests = function(rowId, opt_payload) {
  github.db.row.PullRequests.base(this, 'constructor', rowId, opt_payload);
};
goog.inherits(github.db.row.PullRequests, lf.Row);


/** @override */
github.db.row.PullRequests.prototype.defaultPayload = function() {
  var payload = new github.db.row.PullRequestsType();
  payload.id = 0;
  payload.url = '';
  payload.html_url = '';
  payload.diff_url = '';
  payload.patch_url = '';
  payload.issue_url = '';
  payload.commits_url = '';
  payload.review_comments_url = '';
  payload.review_comment_url = '';
  payload.comments_url = '';
  payload.statuses_url = '';
  payload.number = 0;
  payload.state = '';
  payload.title = '';
  payload.body = '';
  payload.created_at = new Date(0);
  payload.updated_at = new Date(0);
  payload.closed_at = new Date(0);
  payload.merged_at = new Date(0);
  payload.head = '';
  payload.base = '';
  payload.user = 0;
  return payload;
};


/** @override */
github.db.row.PullRequests.prototype.toDbPayload = function() {
  var payload = new github.db.row.PullRequestsDbType();
  payload.id = this.payload().id;
  payload.url = this.payload().url;
  payload.html_url = this.payload().html_url;
  payload.diff_url = this.payload().diff_url;
  payload.patch_url = this.payload().patch_url;
  payload.issue_url = this.payload().issue_url;
  payload.commits_url = this.payload().commits_url;
  payload.review_comments_url = this.payload().review_comments_url;
  payload.review_comment_url = this.payload().review_comment_url;
  payload.comments_url = this.payload().comments_url;
  payload.statuses_url = this.payload().statuses_url;
  payload.number = this.payload().number;
  payload.state = this.payload().state;
  payload.title = this.payload().title;
  payload.body = this.payload().body;
  payload.created_at = this.payload().created_at.getTime();
  payload.updated_at = this.payload().updated_at.getTime();
  payload.closed_at = this.payload().closed_at.getTime();
  payload.merged_at = this.payload().merged_at.getTime();
  payload.head = this.payload().head;
  payload.base = this.payload().base;
  payload.user = this.payload().user;
  return payload;
};


/** @override */
github.db.row.PullRequests.prototype.keyOfIndex = function(indexName) {
  switch (indexName) {
    case 'PullRequests.pkPullRequests':
      return this.payload().id;
    case 'PullRequests.#':
      return this.id();
    default:
      break;
  }
  return null;
};


/** @return {number} */
github.db.row.PullRequests.prototype.getId = function() {
  return this.payload().id;
};


/**
 * @param {number} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setId = function(value) {
  this.payload().id = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getUrl = function() {
  return this.payload().url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setUrl = function(value) {
  this.payload().url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getHtml_url = function() {
  return this.payload().html_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setHtml_url = function(value) {
  this.payload().html_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getDiff_url = function() {
  return this.payload().diff_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setDiff_url = function(value) {
  this.payload().diff_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getPatch_url = function() {
  return this.payload().patch_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setPatch_url = function(value) {
  this.payload().patch_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getIssue_url = function() {
  return this.payload().issue_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setIssue_url = function(value) {
  this.payload().issue_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getCommits_url = function() {
  return this.payload().commits_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setCommits_url = function(value) {
  this.payload().commits_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getReview_comments_url = function() {
  return this.payload().review_comments_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setReview_comments_url = function(value) {
  this.payload().review_comments_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getReview_comment_url = function() {
  return this.payload().review_comment_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setReview_comment_url = function(value) {
  this.payload().review_comment_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getComments_url = function() {
  return this.payload().comments_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setComments_url = function(value) {
  this.payload().comments_url = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getStatuses_url = function() {
  return this.payload().statuses_url;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setStatuses_url = function(value) {
  this.payload().statuses_url = value;
  return this;
};


/** @return {number} */
github.db.row.PullRequests.prototype.getNumber = function() {
  return this.payload().number;
};


/**
 * @param {number} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setNumber = function(value) {
  this.payload().number = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getState = function() {
  return this.payload().state;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setState = function(value) {
  this.payload().state = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getTitle = function() {
  return this.payload().title;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setTitle = function(value) {
  this.payload().title = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getBody = function() {
  return this.payload().body;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setBody = function(value) {
  this.payload().body = value;
  return this;
};


/** @return {!Date} */
github.db.row.PullRequests.prototype.getCreated_at = function() {
  return this.payload().created_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setCreated_at = function(value) {
  this.payload().created_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.PullRequests.prototype.getUpdated_at = function() {
  return this.payload().updated_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setUpdated_at = function(value) {
  this.payload().updated_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.PullRequests.prototype.getClosed_at = function() {
  return this.payload().closed_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setClosed_at = function(value) {
  this.payload().closed_at = value;
  return this;
};


/** @return {!Date} */
github.db.row.PullRequests.prototype.getMerged_at = function() {
  return this.payload().merged_at;
};


/**
 * @param {!Date} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setMerged_at = function(value) {
  this.payload().merged_at = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getHead = function() {
  return this.payload().head;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setHead = function(value) {
  this.payload().head = value;
  return this;
};


/** @return {string} */
github.db.row.PullRequests.prototype.getBase = function() {
  return this.payload().base;
};


/**
 * @param {string} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setBase = function(value) {
  this.payload().base = value;
  return this;
};


/** @return {number} */
github.db.row.PullRequests.prototype.getUser = function() {
  return this.payload().user;
};


/**
 * @param {number} value
 * @return {!github.db.row.PullRequests}
*/
github.db.row.PullRequests.prototype.setUser = function(value) {
  this.payload().user = value;
  return this;
};



/**
 * @extends {lf.schema.Table.<!github.db.row.CommitsType,
 *     !github.db.row.CommitsDbType>}
 * @constructor
 */
github.db.schema.Commits = function() {
  var cols = [];

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.sha = new lf.schema.BaseColumn(
      this, 'sha', true, lf.Type.STRING);
  cols.push(this.sha);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.url = new lf.schema.BaseColumn(
      this, 'url', false, lf.Type.STRING);
  cols.push(this.url);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.author = new lf.schema.BaseColumn(
      this, 'author', false, lf.Type.INTEGER);
  cols.push(this.author);

  /** @type {!lf.schema.BaseColumn.<number>} */
  this.committer = new lf.schema.BaseColumn(
      this, 'committer', false, lf.Type.INTEGER);
  cols.push(this.committer);

  /** @type {!lf.schema.BaseColumn.<string>} */
  this.message = new lf.schema.BaseColumn(
      this, 'message', false, lf.Type.STRING);
  cols.push(this.message);

  var indices = [
    new lf.schema.Index('Commits', 'pkCommits', true, ['sha'])
  ];

  github.db.schema.Commits.base(
      this, 'constructor', 'Commits', cols, indices, false);
};
goog.inherits(github.db.schema.Commits, lf.schema.Table);


/** @override */
github.db.schema.Commits.prototype.createRow = function(opt_value) {
  return new github.db.row.Commits(lf.Row.getNextId(), opt_value);
};


/** @override */
github.db.schema.Commits.prototype.deserializeRow = function(dbRecord) {
  return new github.db.row.Commits(dbRecord['id'], dbRecord['value']);
};


/** @override */
github.db.schema.Commits.prototype.getConstraint = function() {
  var pk = new lf.schema.Index('Commits', 'pkCommits', true, ['sha']);
  var notNullable = [
    this.sha,
    this.url,
    this.author,
    this.committer,
    this.message
  ];
  var foreignKeys = [];
  var unique = [
  ];
  return new lf.schema.Constraint(pk, notNullable, foreignKeys, unique);
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.CommitsType = function() {
  /** @export @type {string} */
  this.sha;
  /** @export @type {string} */
  this.url;
  /** @export @type {number} */
  this.author;
  /** @export @type {number} */
  this.committer;
  /** @export @type {string} */
  this.message;
};



/**
 * @export
 * @constructor
 * @struct
 * @final
 */
github.db.row.CommitsDbType = function() {
  /** @export @type {string} */
  this.sha;
  /** @export @type {string} */
  this.url;
  /** @export @type {number} */
  this.author;
  /** @export @type {number} */
  this.committer;
  /** @export @type {string} */
  this.message;
};



/**
 * Constructs a new Commits row.
 * @constructor
 * @extends {lf.Row.<!github.db.row.CommitsType,
 *     !github.db.row.CommitsDbType>}
 *
 * @param {number} rowId The row ID.
 * @param {!github.db.row.CommitsType=} opt_payload
 */
github.db.row.Commits = function(rowId, opt_payload) {
  github.db.row.Commits.base(this, 'constructor', rowId, opt_payload);
};
goog.inherits(github.db.row.Commits, lf.Row);


/** @override */
github.db.row.Commits.prototype.defaultPayload = function() {
  var payload = new github.db.row.CommitsType();
  payload.sha = '';
  payload.url = '';
  payload.author = 0;
  payload.committer = 0;
  payload.message = '';
  return payload;
};


/** @override */
github.db.row.Commits.prototype.toDbPayload = function() {
  var payload = new github.db.row.CommitsDbType();
  payload.sha = this.payload().sha;
  payload.url = this.payload().url;
  payload.author = this.payload().author;
  payload.committer = this.payload().committer;
  payload.message = this.payload().message;
  return payload;
};


/** @override */
github.db.row.Commits.prototype.keyOfIndex = function(indexName) {
  switch (indexName) {
    case 'Commits.pkCommits':
      return this.payload().sha;
    case 'Commits.#':
      return this.id();
    default:
      break;
  }
  return null;
};


/** @return {string} */
github.db.row.Commits.prototype.getSha = function() {
  return this.payload().sha;
};


/**
 * @param {string} value
 * @return {!github.db.row.Commits}
*/
github.db.row.Commits.prototype.setSha = function(value) {
  this.payload().sha = value;
  return this;
};


/** @return {string} */
github.db.row.Commits.prototype.getUrl = function() {
  return this.payload().url;
};


/**
 * @param {string} value
 * @return {!github.db.row.Commits}
*/
github.db.row.Commits.prototype.setUrl = function(value) {
  this.payload().url = value;
  return this;
};


/** @return {number} */
github.db.row.Commits.prototype.getAuthor = function() {
  return this.payload().author;
};


/**
 * @param {number} value
 * @return {!github.db.row.Commits}
*/
github.db.row.Commits.prototype.setAuthor = function(value) {
  this.payload().author = value;
  return this;
};


/** @return {number} */
github.db.row.Commits.prototype.getCommitter = function() {
  return this.payload().committer;
};


/**
 * @param {number} value
 * @return {!github.db.row.Commits}
*/
github.db.row.Commits.prototype.setCommitter = function(value) {
  this.payload().committer = value;
  return this;
};


/** @return {string} */
github.db.row.Commits.prototype.getMessage = function() {
  return this.payload().message;
};


/**
 * @param {string} value
 * @return {!github.db.row.Commits}
*/
github.db.row.Commits.prototype.setMessage = function(value) {
  this.payload().message = value;
  return this;
};
goog.provide('github.db');

goog.require('github.db.schema.Database');
goog.require('lf.Global');
goog.require('lf.base.BackStoreType');
/** @suppress {extraRequire} */
goog.require('lf.fn');
/** @suppress {extraRequire} */
goog.require('lf.op');
goog.require('lf.proc.Database');
goog.require('lf.service');
goog.require('lf.service.ServiceId');


/**
 * @return {!lf.Global} The Global instance that refers to github.db.
 */
github.db.getGlobal = function() {
  var namespacedGlobalId = new lf.service.ServiceId('ns_github');
  var global = lf.Global.get();

  var namespacedGlobal = null;
  if (!global.isRegistered(namespacedGlobalId)) {
    namespacedGlobal = new lf.Global();
    global.registerService(namespacedGlobalId, namespacedGlobal);
  } else {
    namespacedGlobal = global.getService(namespacedGlobalId);
  }

  return namespacedGlobal;
};


/** @return {!lf.schema.Database} */
github.db.getSchema = function() {
  var global = github.db.getGlobal();

  if (!global.isRegistered(lf.service.SCHEMA)) {
    var schema = new github.db.schema.Database();
    global.registerService(lf.service.SCHEMA, schema);
  }
  return global.getService(lf.service.SCHEMA);
};


/**
 * @param {!function(!lf.raw.BackStore):!IThenable=} opt_onUpgrade
 * @param {boolean=} opt_volatile Default to false
 * @return {!IThenable.<!lf.proc.Database>}
 */
github.db.getInstance = function(opt_onUpgrade, opt_volatile) {
  github.db.getSchema();
  var db = new lf.proc.Database(github.db.getGlobal());
  return db.init(
      opt_onUpgrade,
      opt_volatile ? lf.base.BackStoreType.MEMORY : undefined,
      false);
};
