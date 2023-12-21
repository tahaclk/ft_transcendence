from django.db import models

class UserManage(models.Model):
	name = models.CharField(max_length=50)
	surname = models.CharField(max_length=50)
	username = models.CharField(max_length=50)
