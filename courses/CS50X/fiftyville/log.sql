-- Keep a log of any SQL queries you execute as you solve the mystery.

-- What we know: the theft took place on July 28, 2023 and that it took place on Humphrey Street.

--Look at the tables
.tables
--airports              crime_scene_reports   people
--atm_transactions      flights               phone_calls
--bakery_security_logs  interviews
--bank_accounts         passengers

--Look at schema
.schema

-- search criminal reports for date and street
SELECT *
FROM crime_scene_reports
WHERE month = 7
AND day = 28
AND street = 'Humphrey Street';
-- What we know: DATE: July 28, 2023 TIME:10:15am PLACE:Humphrey Street Bakery WITNESSES: 3, Interview transcript mentions bakery

-- Next Step: Search Interviews
SELECT *
FROM interviews
WHERE month = 7
AND day = 28
AND transcript LIKE '%bakery%';
-- What we know: DATE: July 28, 2023 TIME:10:15am PLACE:Humphrey Street Bakery WITNESSES: 3: Ruth,Eugene, Raymond, Interview transcript mentions bakery
-- (1) RUTH: Sometime within ten minutes of the theft, I saw the thief get into a car in the bakery parking lot and drive away. If you have security footage from the bakery parking lot, you might want to look for cars that left the parking lot in that time frame.
-- (2) EUGENE: I don't know the thief's name, but it was someone I recognized. Earlier this morning, before I arrived at Emma's bakery, I was walking by the ATM on Leggett Street and saw the thief there withdrawing some money
-- (3) RAYMOND:As the thief was leaving the bakery, they called someone who talked to them for less than a minute. In the call, I heard the thief say that they were planning to take the earliest flight out of Fiftyville tomorrow. The thief then asked the person on the other end of the phone to purchase the flight ticket.

-- Following first Hint: Search bakery security logs for cars:
SELECT *
FROM bakery_security_logs
WHERE month = 7
AND day = 28
AND hour = 10 AND minute BETWEEN 15 AND 25;
-- Count visits of Cars
SELECT *
FROM bakery_security_logs
WHERE license_plate
    IN (SELECT license_plate
    FROM bakery_security_logs
    WHERE month = 7
    AND day = 28
    AND hour = 10
    AND minute BETWEEN 15 AND 25)
ORDER BY license_plate;
-- Each car just visited once
-- check on people with this licenseplates
SELECT *
FROM people, bakery_security_logs
WHERE people.license_plate = bakery_security_logs.license_plate
AND bakery_security_logs.license_plate
    IN (SELECT license_plate
    FROM bakery_security_logs
    WHERE month = 7
    AND day = 28
    AND hour = 10
    AND minute BETWEEN 15 AND 25)
ORDER BY name;

-- following second hint: Search ATM transactions befor Eugene arrived:
SELECT *
FROM people, bakery_security_logs
WHERE people.license_plate = bakery_security_logs.license_plate
AND people.name ='Eugene';
-- There is no record for that day when Eugen did arrive at the bakery... either he walked or he's a liar..
-- Check ATM anyways
SELECT *
FROM atm_transactions
WHERE month = 7
AND day = 28
AND atm_location = 'Leggett Street';
-- 8 Record of type withdraw
-- try matching bakery visitors with atm transactions and get information from people via bank_accounts
SELECT *
FROM people, bakery_security_logs, atm_transactions, bank_accounts
WHERE people.license_plate = bakery_security_logs.license_plate
AND bank_accounts.person_id = people.id
AND atm_transactions.account_number = bank_accounts.account_number
AND bakery_security_logs.license_plate
IN (
    SELECT license_plate
    FROM bakery_security_logs
    WHERE month = 7
    AND day = 28
    AND hour = 10
    AND minute BETWEEN 15 AND 25)
AND bank_accounts.account_number
IN (
    SELECT account_number
    FROM atm_transactions
    WHERE month = 7
    AND day = 28
    AND atm_location = 'Leggett Street')
AND atm_location = 'Leggett Street'
AND atm_transactions.month = 7
AND atm_transactions.day = 28;
-- Four Suspects found

--following third hint:
SELECT *
FROM phone_calls
WHERE month = 7
AND day = 28
AND duration < 60
AND
    caller IN ( SELECT people.phone_number
        FROM people, bakery_security_logs, atm_transactions, bank_accounts
        WHERE people.license_plate = bakery_security_logs.license_plate
        AND bank_accounts.person_id = people.id
        AND atm_transactions.account_number = bank_accounts.account_number
        AND bakery_security_logs.license_plate
        IN (
            SELECT license_plate
            FROM bakery_security_logs
            WHERE month = 7
            AND day = 28
            AND hour = 10
            AND minute BETWEEN 15 AND 25)
        AND bank_accounts.account_number
        IN (
            SELECT account_number
            FROM atm_transactions
            WHERE month = 7
            AND day = 28
            AND atm_location = 'Leggett Street')
        AND atm_location = 'Leggett Street'
        AND atm_transactions.month = 7
        AND atm_transactions.day = 28);
-- identify caller
SELECT phone_calls.caller, people.name
FROM phone_calls, people
WHERE phone_calls.caller = people.phone_number
AND month = 7
AND day = 28
AND duration < 60
AND
    caller IN ( SELECT people.phone_number
        FROM people, bakery_security_logs, atm_transactions, bank_accounts
        WHERE people.license_plate = bakery_security_logs.license_plate
        AND bank_accounts.person_id = people.id
        AND atm_transactions.account_number = bank_accounts.account_number
        AND bakery_security_logs.license_plate
        IN (
            SELECT license_plate
            FROM bakery_security_logs
            WHERE month = 7
            AND day = 28
            AND hour = 10
            AND minute BETWEEN 15 AND 25)
        AND bank_accounts.account_number
        IN (
            SELECT account_number
            FROM atm_transactions
            WHERE month = 7
            AND day = 28
            AND atm_location = 'Leggett Street')
        AND atm_location = 'Leggett Street'
        AND atm_transactions.month = 7
        AND atm_transactions.day = 28)
UNION
SELECT phone_calls.receiver, people.name
FROM phone_calls, people
WHERE phone_calls.receiver = people.phone_number
AND month = 7
AND day = 28
AND duration < 60
AND
    caller IN ( SELECT people.phone_number
        FROM people, bakery_security_logs, atm_transactions, bank_accounts
        WHERE people.license_plate = bakery_security_logs.license_plate
        AND bank_accounts.person_id = people.id
        AND atm_transactions.account_number = bank_accounts.account_number
        AND bakery_security_logs.license_plate
        IN (
            SELECT license_plate
            FROM bakery_security_logs
            WHERE month = 7
            AND day = 28
            AND hour = 10
            AND minute BETWEEN 15 AND 25)
        AND bank_accounts.account_number
        IN (
            SELECT account_number
            FROM atm_transactions
            WHERE month = 7
            AND day = 28
            AND atm_location = 'Leggett Street')
        AND atm_location = 'Leggett Street'
        AND atm_transactions.month = 7
        AND atm_transactions.day = 28);
-- check whos on the first flight out of town
SELECT *
FROM people, flights, passengers, airports
WHERE people.passport_number = passengers.passport_number
AND passengers.flight_id = flights.id
AND flights.origin_airport_id = airports.id
AND airports.city = 'Fiftyville'
AND flights.month = 7
AND flights.day = 29
AND people.name IN(
    SELECT people.name
    FROM phone_calls, people
    WHERE phone_calls.caller = people.phone_number
    AND month = 7
    AND day = 28
    AND duration < 60
    AND
        caller IN (SELECT people.phone_number
            FROM people, bakery_security_logs, atm_transactions, bank_accounts
            WHERE people.license_plate = bakery_security_logs.license_plate
            AND bank_accounts.person_id = people.id
            AND atm_transactions.account_number = bank_accounts.account_number
            AND bakery_security_logs.license_plate
            IN (
                SELECT license_plate
                FROM bakery_security_logs
                WHERE month = 7
                AND day = 28
                AND hour = 10
                AND minute BETWEEN 15 AND 25)
            AND bank_accounts.account_number
            IN (
                SELECT account_number
                FROM atm_transactions
                WHERE month = 7
                AND day = 28
                AND atm_location = 'Leggett Street')
            AND atm_location = 'Leggett Street'
            AND atm_transactions.month = 7
            AND atm_transactions.day = 28)
    UNION
    SELECT people.name
    FROM phone_calls, people
    WHERE phone_calls.receiver = people.phone_number
    AND month = 7
    AND day = 28
    AND duration < 60
    AND
        caller IN ( SELECT people.phone_number
            FROM people, bakery_security_logs, atm_transactions, bank_accounts
            WHERE people.license_plate = bakery_security_logs.license_plate
            AND bank_accounts.person_id = people.id
            AND atm_transactions.account_number = bank_accounts.account_number
            AND bakery_security_logs.license_plate
            IN (
                SELECT license_plate
                FROM bakery_security_logs
                WHERE month = 7
                AND day = 28
                AND hour = 10
                AND minute BETWEEN 15 AND 25)
            AND bank_accounts.account_number
            IN (
                SELECT account_number
                FROM atm_transactions
                WHERE month = 7
                AND day = 28
                AND atm_location = 'Leggett Street')
            AND atm_location = 'Leggett Street'
            AND atm_transactions.month = 7
            AND atm_transactions.day = 28))
ORDER BY flights.hour, flights.minute;
-- to simplify things i could have created a table with all main suspect and the importend data
SELECT * FROM airports WHERE id = 4;
-- Bruce were at the atm, the bakery, called Robin and were on the flight out of town to destination airport_id 4 = New York City

