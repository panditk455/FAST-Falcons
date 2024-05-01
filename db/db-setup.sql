-- db-setup.sql
CREATE DATABASE USER_LOGINS;

USE USER_LOGINS;

CREATE TABLE user(username TEXT, pass_word TEXT, visited_welcome BOOLEAN DEFAULT FALSE);

INSERT INTO
    user (username, pass_word)
VALUES
    ('db', 'randompasswordRN');

CREATE USER 'webapp' @'%' IDENTIFIED BY 'randompasswordRN';

GRANT ALL ON USER_LOGINS.* TO 'webapp' @'%';


-- mysql -u 
-- fuuncion to get called whe u press that button.
--x
