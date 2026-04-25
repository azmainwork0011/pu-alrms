# PU-ALRMS Proguard Rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keepclassmembers class * {
    public protected *;
}
