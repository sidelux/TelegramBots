-- MySQL dump 10.19  Distrib 10.3.38-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: R6Stats
-- ------------------------------------------------------
-- Server version	10.3.38-MariaDB-0+deb10u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contest`
--

DROP TABLE IF EXISTS `contest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` bigint(11) NOT NULL,
  `username` varchar(64) NOT NULL,
  `contest_username` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_group`
--

DROP TABLE IF EXISTS `contest_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` bigint(11) NOT NULL,
  `chat_id` varchar(32) NOT NULL,
  `join_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `invite_history`
--

DROP TABLE IF EXISTS `invite_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invite_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` bigint(11) NOT NULL,
  `username` varchar(64) DEFAULT NULL,
  `send_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player_history`
--

DROP TABLE IF EXISTS `player_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ubisoft_id` varchar(64) NOT NULL,
  `platform` varchar(16) NOT NULL,
  `username` varchar(64) NOT NULL,
  `level` int(11) NOT NULL,
  `xp` int(11) NOT NULL,
  `ranked_plays` int(11) NOT NULL,
  `ranked_wins` int(11) NOT NULL,
  `ranked_losses` int(11) NOT NULL,
  `ranked_wl` decimal(9,3) NOT NULL DEFAULT 0.000,
  `ranked_kills` int(11) NOT NULL,
  `ranked_deaths` int(11) NOT NULL,
  `ranked_kd` decimal(9,3) NOT NULL,
  `ranked_playtime` int(11) NOT NULL,
  `casual_plays` int(11) NOT NULL,
  `casual_wins` int(11) NOT NULL,
  `casual_losses` int(11) NOT NULL,
  `casual_wl` decimal(9,3) NOT NULL DEFAULT 0.000,
  `casual_kills` int(11) NOT NULL,
  `casual_deaths` int(11) NOT NULL,
  `casual_kd` decimal(9,3) NOT NULL,
  `casual_playtime` int(11) NOT NULL,
  `last_match_skill_stdev_change` decimal(12,10) NOT NULL,
  `last_match_mmr_change` int(3) NOT NULL,
  `last_match_skill_mean_change` decimal(12,10) NOT NULL,
  `last_match_result` tinyint(1) NOT NULL,
  `revives` int(11) NOT NULL,
  `suicides` int(11) NOT NULL,
  `reinforcements_deployed` int(11) NOT NULL,
  `barricades_built` int(11) NOT NULL,
  `bullets_hit` int(11) NOT NULL,
  `headshots` int(11) NOT NULL,
  `melee_kills` int(11) NOT NULL,
  `penetration_kills` int(11) NOT NULL,
  `assists` int(11) NOT NULL,
  `season_id` int(11) NOT NULL DEFAULT 0,
  `season_rank` int(11) NOT NULL DEFAULT 0,
  `season_mmr` decimal(12,8) NOT NULL DEFAULT 0.00000000,
  `season_max_mmr` decimal(12,8) NOT NULL DEFAULT 0.00000000,
  `top_rank_position` int(11) NOT NULL,
  `mode_secure` int(11) NOT NULL DEFAULT 0,
  `mode_hostage` int(11) NOT NULL DEFAULT 0,
  `mode_bomb` int(11) NOT NULL DEFAULT 0,
  `operator_max_kd_name` varchar(64) DEFAULT NULL,
  `operator_max_kd` decimal(12,8) NOT NULL DEFAULT 0.00000000,
  `operator_max_wl_name` varchar(64) DEFAULT NULL,
  `operator_max_wl` decimal(12,8) NOT NULL DEFAULT 0.00000000,
  `operator_max_plays_name` varchar(64) DEFAULT NULL,
  `operator_max_plays` int(11) NOT NULL DEFAULT 0,
  `operator_max_wins_name` varchar(64) DEFAULT NULL,
  `operator_max_wins` int(11) NOT NULL DEFAULT 0,
  `operator_max_losses_name` varchar(64) DEFAULT NULL,
  `operator_max_losses` int(11) NOT NULL DEFAULT 0,
  `operator_max_kills_name` varchar(64) DEFAULT NULL,
  `operator_max_kills` int(11) NOT NULL DEFAULT 0,
  `operator_max_deaths_name` varchar(64) DEFAULT NULL,
  `operator_max_deaths` int(11) NOT NULL DEFAULT 0,
  `operator_max_playtime_name` varchar(64) DEFAULT NULL,
  `operator_max_playtime` int(11) NOT NULL DEFAULT 0,
  `operator_max_meleekills_name` varchar(64) DEFAULT NULL,
  `operator_max_meleekills` int(11) NOT NULL DEFAULT 0,
  `operator_max_headshot_name` varchar(64) DEFAULT NULL,
  `operator_max_headshot` int(11) NOT NULL DEFAULT 0,
  `operator_max_dbno_name` varchar(64) DEFAULT NULL,
  `operator_max_dbno` int(11) NOT NULL DEFAULT 0,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `insert_date` (`insert_date`),
  KEY `platform` (`platform`),
  KEY `username` (`username`),
  KEY `ubisoft_id` (`ubisoft_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `recruit_history`
--

DROP TABLE IF EXISTS `recruit_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recruit_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` bigint(11) NOT NULL,
  `chat_id` varchar(32) NOT NULL,
  `insert_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `season_history`
--

DROP TABLE IF EXISTS `season_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `season_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `platform` varchar(16) NOT NULL,
  `season_id` int(11) NOT NULL,
  `mmr` decimal(12,8) NOT NULL,
  `max_mmr` decimal(12,8) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `creation_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `tag_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `stats_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `team_member`
--

DROP TABLE IF EXISTS `team_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_member` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `username` varchar(64) NOT NULL,
  `role` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `team_id` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` bigint(11) NOT NULL,
  `last_chat_id` varchar(32) DEFAULT NULL,
  `last_username` varchar(64) DEFAULT NULL,
  `lang` varchar(2) DEFAULT NULL,
  `region` varchar(8) DEFAULT NULL,
  `default_username` varchar(32) DEFAULT NULL,
  `default_platform` varchar(32) DEFAULT NULL,
  `force_update` tinyint(4) NOT NULL DEFAULT 0,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_force_update` timestamp NULL DEFAULT NULL,
  `last_stats` timestamp NULL DEFAULT NULL,
  `undefined_track` tinyint(4) NOT NULL DEFAULT 0,
  `last_graph` varchar(64) DEFAULT NULL,
  `report` tinyint(4) NOT NULL DEFAULT 1,
  `daily_report` tinyint(1) NOT NULL DEFAULT 0,
  `daily_report_sent` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
