# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor + plugins reflectively dispatch to bridged classes — keep all
# annotated bridge methods and plugin classes intact under R8.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}

# Keep JS bridge interface (Capacitor uses WebView with JavaScriptInterface)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for stack traces in crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
