#Requires AutoHotkey v2.0
#SingleInstance Force
#WinActivateForce
CoordMode "Mouse","Screen"
SetDefaultMouseSpeed 0
#Include %A_ScriptDir%\library.ahk

;Replace librewolf.exe if different
if !ProcessExist("librewolf.exe"){
Run "pathtobrowser"
}

ProcessWait "librewolf.exe"
sizef("ahk_exe librewolf.exe")
ProcessWaitClose "librewolf.exe"
ExitApp

global easyedit := 1

$#1::{
	global easyedit
	easyedit := !easyedit
    if(easyedit){
	MsgBox "easyedit ON",,"T0.4"
	}
	else{
    MsgBox "easyedit OFF",,"T0.4"
	}
}

#HotIf WinActive("LRC Editor & Timer - SeinopSys — LibreWolf") && easyedit=1
;Replace WinTitle if different (right click script tray icon and use Windows Spy)
moveout(a){
MouseGetPos(&x,&y)
slowclick(196,753)
slowsend(a)
MouseMove x,y
}

;Seek left
$q::{
moveout("{Left}")
}

;Seek right
$e::{
moveout("{Right}")
}

;Play/pause
$Space::{
moveout("{Space}")
}

;Adjust timestamps when field focused. Each tick=100ms.
tick(a,b){
slowclick()
loop b{
slowmod(a)
}
}

$a::{
tick("{Down}",2)
}
$s::{
tick("{Down}",4)
}
$x::{
tick("{Down}",10)
}
$c::{
tick("{Up}",10)
}
$d::{
tick("{Up}",4)
}
$f::{
tick("{Up}",2)
}

#HotIf

$#r::{
MsgBox A_ScriptName " RELOAD",,"T0.4"
Reload
}

$#f::{
MsgBox A_ScriptName " EXIT",,"T0.4"
ExitApp
}