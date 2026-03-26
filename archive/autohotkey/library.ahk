#Requires AutoHotkey v2.0
#SingleInstance Force
#WinActivateForce
CoordMode "Mouse","Screen"
SetDefaultMouseSpeed 0

sizecustom(a,b,c,d,e){
WinWait e
focuswindow()
WinMove a,b,c,d,e
}

sizef(a){
sizecustom(-11,-11,1942,1056,a)
}

slowsend(a,b:=100){
Send a
Sleep b
}

slowdown(a:="RCtrl",b:=0){
slowsend("{" a " down}",b)
}

slowup(a:="RCtrl",b:=0){
slowsend("{" a " up}",b)
}

slowpress(a,b:=100,c:=100){
slowdown(a,b)
slowup(a,c)
}

slowmod(a,b:="RCtrl",c:=0,d:=100,e:=0){
slowdown(b,c)
slowsend(a,d)
slowup(b,e)
}

slowclick(a:="",b:="",c:=100,d:=100){
MouseGetPos(&x,&y)
if (a="" OR b=""){
MouseGetPos(&a,&b)
}
MouseMove a,b
slowpress("LButton",c,d)
MouseMove x,y
}