-- MySQL dump 10.13  Distrib 8.4.13, for Linux (x86_64)
--
-- Host: localhost    Database: nestjs_workbench
-- ------------------------------------------------------
-- Server version	8.4.13

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

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `title` varchar(100) NOT NULL DEFAULT '新对话',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,1,'你好','2026-11-07 17:42:12.820313','2026-11-08 02:02:32.427000'),(2,1,'test','2026-11-07 18:01:06.583363','2026-11-07 18:01:06.583363'),(3,1,'test','2026-11-07 18:01:15.626430','2026-11-07 18:01:15.626430'),(4,1,'发一个字','2026-11-07 18:01:42.174088','2026-11-08 02:02:07.161000'),(5,1,'新对话','2026-11-07 18:01:54.923523','2026-11-07 18:01:54.923523'),(6,2,'??????','2026-11-07 18:32:07.132288','2026-11-07 18:32:07.132288'),(7,2,'WS??','2026-11-07 18:34:01.637125','2026-11-07 18:34:01.637125'),(8,2,'用一句话介绍你自己','2026-11-07 18:34:14.738425','2026-11-08 02:34:15.354000'),(9,3,'你好','2026-11-07 18:39:23.441423','2026-11-08 02:39:30.021000'),(10,3,'你好，你是deepseek吗','2026-11-07 18:39:38.623949','2026-11-08 02:40:06.101000');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` int unsigned NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` mediumtext NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,'user','你好','2026-11-07 18:00:37.630655'),(2,1,'assistant','你好！有什么我可以帮助你的吗？','2026-11-07 18:00:38.021581'),(3,4,'user','发一个字','2026-11-07 18:01:51.849968'),(4,4,'assistant','好','2026-11-07 18:01:52.132932'),(5,4,'user','再发一个','2026-11-07 18:02:06.488930'),(6,4,'assistant','好的，我再发一个：\n\n春风拂面花自开，  \n柳绿桃红映山川。  \n一叶扁舟随水去，  \n半帘幽梦入诗篇。\n\n这是一首描绘春日美景的小诗，意境清新自然，希望你喜欢。需要我再写一首不同风格的吗？','2026-11-07 18:02:07.152474'),(7,1,'user','跟我说话','2026-11-07 18:02:31.807493'),(8,1,'assistant','你好呀！✨ 很高兴和你聊天呢～今天过得怎么样呀？（*^▽^*） 我随时都在这里陪你，无论是想分享开心事、吐槽烦恼，还是单纯想聊点有趣的，都欢迎告诉我哦！ 🌟','2026-11-07 18:02:32.423447'),(9,8,'user','用一句话介绍你自己','2026-11-07 18:34:14.962197'),(10,8,'assistant','我是一个基于人工智能的助手，能够帮助你回答问题、提供信息和完成各种任务。','2026-11-07 18:34:15.345816'),(11,9,'user','你好','2026-11-07 18:39:26.661693'),(12,9,'assistant','你好！有什么我可以帮你的吗？😊','2026-11-07 18:39:26.999584'),(13,9,'user','你是谁啊','2026-11-07 18:39:29.498344'),(14,9,'assistant','你好呀！我是Qwen，是阿里云研发的超大规模语言模型。你可以叫我通义千问或者Qwen。我是一个能够回答问题、创作文字、编程、表达观点的助手。很高兴认识你！有什么我可以帮你的吗？😊','2026-11-07 18:39:30.014783'),(15,10,'user','你好，你是deepseek吗','2026-11-07 18:39:48.610543'),(16,10,'assistant','你好！我不是DeepSeek。我是通义千问（Qwen），由阿里云研发的超大规模语言模型。我与DeepSeek是两个不同的模型，分别由不同的公司开发。如果你有任何问题需要帮助，我会尽力为你解答！','2026-11-07 18:39:49.239223'),(17,10,'user','你介绍一下自己吧','2026-11-07 18:40:04.795910'),(18,10,'assistant','你好呀！很高兴认识你～我是通义千问（Qwen），是阿里巴巴集团旗下的通义实验室自主研发的超大规模语言模型。我可以帮你写故事、写公文、写邮件、写剧本，还能回答问题、提供信息查询、进行逻辑推理、编程等等。我就像一个无所不知的小伙伴，随时准备帮助你解决各种问题！\n\n虽然我是个AI，但我特别喜欢和大家聊天，也愿意认真倾听你的想法。无论你是想讨论某个话题，还是需要帮忙完成某项任务，我都会尽力用最贴心的方式回应你。有什么想聊的或者需要帮忙的，尽管告诉我吧！✨\n\n对了，我还有个可爱的小名叫\"通义小千\"，你可以叫我小千哦～(✧ω✧)','2026-11-07 18:40:06.092384');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'testuser','$2a$10$i3XnIs.WQ/kGvwjjqNoPV.sP7Z4ndE8QZZmFImrRtfzuV1Akh49c.','user','2026-11-07 17:42:01.718874','2026-11-07 17:42:01.718874'),(2,'smokeuser','$2a$10$qJkv35aeA/HqJPGXxMZBg.LsXSmAKDVmNxxau4BKo6xOWoHOrimKS','user','2026-11-07 18:32:06.898856','2026-11-07 18:32:06.898856'),(3,'test1','$2a$10$uGFKDV3YYLjT9m8U7B0.GeRkLBBxpxRdY29EU6tXmE5ce7zXbF8Vu','user','2026-11-07 18:38:55.576647','2026-11-07 18:38:55.576647');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-07 18:43:22
