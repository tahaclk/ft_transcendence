from django.db import models

class UserManage(models.Model):
	uid = models.IntegerField(null=False, default=-1)
	name = models.CharField(max_length=50)
	surname = models.CharField(max_length=50)
	username = models.CharField(max_length=50)
	displayname = models.CharField(max_length=50)

	def __str__(self):
		return f"{self.id} {self.uid} {self.name} {self.surname} {self.username} {self.displayname}"
