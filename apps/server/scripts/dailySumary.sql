use pingdom;

/*
  script to sumarize the results of the pings daily
*/
SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;

DROP TABLE IF EXISTS TEMP_PING;

CREATE TEMPORARY TABLE TEMP_PING (
    idServer VARCHAR(255) NOT NULL, `avg` DOUBLE, `min` DOUBLE, `max` DOUBLE, times int, packetLoss int, isAlive tinyint, numericHost varchar(250)
);

SET @currentDay = now();

SET @dayBefore = DATE_SUB(@currentDay, INTERVAL 1 DAY);

INSERT INTO
    TEMP_PING (
        idServer, `avg`, `min`, `max`, times, packetLoss, isAlive, numericHost
    )
SELECT
    p.idServer,
    avg(p.avg) as 'avg',
    min(p.min) as 'min',
    max(p.max) as 'max',
    avg(p.times) as times,
    avg(p.packetLoss) as packetLoss,
    avg(p.isAlive) as isAlive,
    max(p.numericHost) as numericHost
FROM pingdom.Pings p
WHERE
    p.created_at <= @currentDay
    AND p.created_at >= @dayBefore
GROUP BY
    p.idServer;
#borrar pings del dia anterior
DELETE FROM pingdom.Pings
WHERE
    idPing IN (
        SELECT p.idPing
        FROM (
                SELECT idPing
                FROM pingdom.Pings
                WHERE
                    created_at <= @currentDay
                    AND created_at >= @dayBefore
            ) AS p
    );
## insertar resumen
INSERT INTO
    pingdom.Pings (
        idPing, idServer, `avg`, `min`, `max`, times, packetLoss, isAlive, numericHost, log
    )
SELECT UUID() as `idPing`, tp.idServer, tp.`avg`, tp.`min`, tp.`max`, tp.times, tp.packetLoss, tp.isAlive, tp.numericHost, 'DAILY SUMMARY'
FROM TEMP_PING tp;

ROLLBACK;

SET SQL_SAFE_UPDATES = 1;