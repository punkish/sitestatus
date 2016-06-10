CREATE DATABASE macrostrat_status;
\connect macrostrat_status;

CREATE TABLE applications (
  app_id serial not null,
  category varchar(100),
  code varchar(100),
  name varchar(150),
  uri varchar(200),
  timeout integer
);

CREATE INDEX ON applications (app_id);
CREATE INDEX ON applications (category);

INSERT INTO applications (category, code, name, uri, timeout) VALUES
('macrostrat', 'macrostratWeb', 'Macrostrat homepage', 'https://macrostrat.org', null),
('macrostrat', 'macrostratAPI', 'Macrostrat API', 'https://macrostrat.org/api/columns?sample', null),
('macrostrat', 'devMacrostratWeb', 'Dev Macrostrat homepage', 'https://dev.macrostrat.org', null),
('macrostrat', 'devMacrostratAPI', 'Dev Macrostrat API', 'https://dev.macrostrat.org/api/columns?sample', null),
('macrostrat', 'macrostratTiles', 'Tile server', 'https://macrostrat.org/api/v2/maps/burwell/vanilla/3/1/2/tile.png', null),
('macrostrat', 'macrostratClassic', 'Macrostrat Classic', 'https://macrostrat.org/classic/', 5000),

('paleodb', 'paleodb', 'PaleoDB homepage', 'https://paleobiodb.org', null),
('paleodb', 'paleodbAPI', 'PaleoDB Data Service', 'https://paleobiodb.org/data1.2/occs/single.json?id=1001&show=loc', null),
('paleodb', 'devPaleodb', 'Dev PaleoDB homepage', 'https://training.paleobiodb.org', null),
('paleodb', 'devPaleodbAPI', 'Dev PaleoDB Data Service', 'https://training.paleobiodb.org/data1.2/occs/single.json?id=1001&show=loc', null),
('paleodb', 'paleodbLarkin', 'Larkin', 'https://paleobiodb.org/larkin/resources', null),
('paleodb', 'devPaleodbLarkin', 'Dev Larkin', 'https://training.paleobiodb.org/larkin/resources', null),

('geodeepdive', 'geodeepdive', 'GeoDeepDive', 'https://geodeepdive.org', null),
('geodeepdive', 'geodeepdiveAPI', 'GeoDeepDive API', 'https://geodeepdive.org/api/articles?recent&max=10', null),

('rockd', 'rockd', 'Rockd homepage', 'https://rockd.org', null),
('rockd', 'rockAPI', 'Rockd API', 'https://rockd.org/api', null),

('michiganbasinfossils', 'michiganBasinFossils', 'Michigan Basin Fossils', 'http://michiganbasinfossils.org', null),
('other', 'strata', 'Strata homepage', 'http://strata.geology.wisc.edu', null);


CREATE TABLE application_status (
  app_id integer,
  snap_id varchar(70),
  status integer not null
);

CREATE INDEX ON application_status (app_id);

CREATE TABLE snapshots (
  snap_id varchar(70),
  start_time timestamp without time zone default now()
)
