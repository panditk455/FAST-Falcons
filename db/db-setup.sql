CREATE DATABASE USER_LOGINS

USE USER_LOGINS;

CREATE TABLE user(
    username TEXT,
    pass_word TEXT
);

INSERT INTO User (username, pass_word) VALUES ('test_username', 'test_password');

CREATE USER 'webapp'@'%' IDENTIFIED BY 'randompasswordRN';

GRANT ALL ON USER_LOGINS.* TO 'webapp'@'%';