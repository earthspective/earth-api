CREATE TABLE `Pins` (
  `PinID` int(11) NOT NULL AUTO_INCREMENT,
  `PinTitle` varchar(200) DEFAULT NULL,
  `PinDesc` varchar(450) DEFAULT NULL,
  `Latitude` decimal(10,8) DEFAULT NULL,
  `Longitude` decimal(11,8) DEFAULT NULL,
  `EventDate` datetime DEFAULT NULL,
  `Tags` varchar(300) DEFAULT NULL,
  `EventPackID` int(11) DEFAULT '1',
  PRIMARY KEY (`PinID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
