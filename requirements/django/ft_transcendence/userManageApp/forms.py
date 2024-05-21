from django import forms

class AvatarUpdateForm(forms.Form):
    uploadfile = forms.ImageField()
