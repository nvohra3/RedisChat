Simple chatroom backed by a Redis cluster.

To host locally:
Run a redis-server (run "redis-server").
Start the server (run "node app.js").
Open a web browser and go to http://localhost:8001/

To host on AWS:
Set up a Redis cluster.
Make sure permissions (security groups) are set up such that you can connect to the cluster.
Set up EC2 instance and Elastic Beanstalk application.
Connect to EC2 instance.