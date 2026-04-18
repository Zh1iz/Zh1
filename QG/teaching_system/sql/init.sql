-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: teaching_system
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '6dc951bb-33e5-11f1-a65a-00ff76847fee:1-70';

--
-- Table structure for table `tb_class_teacher`
--

DROP TABLE IF EXISTS `tb_class_teacher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_class_teacher` (
  `class_id` varchar(50) DEFAULT NULL,
  `teacher_id` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班主任班级绑定表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_class_teacher`
--

LOCK TABLES `tb_class_teacher` WRITE;
/*!40000 ALTER TABLE `tb_class_teacher` DISABLE KEYS */;
INSERT INTO `tb_class_teacher` VALUES ('101','teacher1'),('102','teacher2');
/*!40000 ALTER TABLE `tb_class_teacher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_classes`
--

DROP TABLE IF EXISTS `tb_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_classes` (
  `id` int NOT NULL,
  `class_name` varchar(50) DEFAULT NULL COMMENT '班级名',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班级表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_classes`
--

LOCK TABLES `tb_classes` WRITE;
/*!40000 ALTER TABLE `tb_classes` DISABLE KEYS */;
INSERT INTO `tb_classes` VALUES (101,'高一1班'),(102,'高一2班');
/*!40000 ALTER TABLE `tb_classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_notice_read`
--

DROP TABLE IF EXISTS `tb_notice_read`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_notice_read` (
  `writer_id` varchar(50) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `time` varchar(50) DEFAULT NULL COMMENT '阅读时间',
  `notice_id` int DEFAULT NULL COMMENT '通知ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通知已读表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_notice_read`
--

LOCK TABLES `tb_notice_read` WRITE;
/*!40000 ALTER TABLE `tb_notice_read` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_notice_read` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_notices`
--

DROP TABLE IF EXISTS `tb_notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_notices` (
  `notice_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL COMMENT '标题',
  `text` varchar(100) DEFAULT NULL COMMENT '内容',
  `writer` varchar(50) DEFAULT NULL COMMENT '发布人',
  `class_id` int DEFAULT NULL COMMENT '班级ID',
  PRIMARY KEY (`notice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通知表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_notices`
--

LOCK TABLES `tb_notices` WRITE;
/*!40000 ALTER TABLE `tb_notices` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_operation_logs`
--

DROP TABLE IF EXISTS `tb_operation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_operation_logs` (
  `user` varchar(50) DEFAULT NULL,
  `movement` varchar(50) DEFAULT NULL COMMENT '操作行为',
  `time` varchar(50) DEFAULT NULL COMMENT '操作时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='操作日志表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_operation_logs`
--

LOCK TABLES `tb_operation_logs` WRITE;
/*!40000 ALTER TABLE `tb_operation_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_operation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_scores`
--

DROP TABLE IF EXISTS `tb_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_scores` (
  `student_id` varchar(50) DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL COMMENT '课程名',
  `score` int DEFAULT NULL COMMENT '成绩'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成绩表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_scores`
--

LOCK TABLES `tb_scores` WRITE;
/*!40000 ALTER TABLE `tb_scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_user`
--

DROP TABLE IF EXISTS `tb_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_user` (
  `name` varchar(50) DEFAULT NULL COMMENT '姓名',
  `id` varchar(50) NOT NULL COMMENT '账号',
  `password` varchar(50) DEFAULT NULL COMMENT '密码',
  `role` varchar(50) DEFAULT NULL COMMENT '角色',
  `class` int DEFAULT NULL COMMENT '班级'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_user`
--

LOCK TABLES `tb_user` WRITE;
/*!40000 ALTER TABLE `tb_user` DISABLE KEYS */;
INSERT INTO `tb_user` VALUES ('赵主任','admin1','123456','admin',NULL),('钱老师','teacher1','123456','teacher',NULL),('孙老师','teacher2','123456','teacher',NULL),('小周','stu101','123456','student',101),('小吴','stu102','123456','student',101),('小郑','stu201','123456','student',102),('小王','stu202','123456','student',102);
/*!40000 ALTER TABLE `tb_user` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-16  0:14:31
