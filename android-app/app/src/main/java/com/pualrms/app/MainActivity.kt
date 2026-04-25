package com.pualrms.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

/**
 * PU-ALRMS Main Activity
 * WebView-based app that loads the PU-ALRMS web application
 *
 * Features:
 * - Full-screen WebView with progress bar
 * - Pull-to-refresh
 * - Network error handling with retry
 * - File upload support
 * - Back button navigation history
 * - HTTPS/HTTP support
 */
class MainActivity : AppCompatActivity() {

    companion object {
        // ═══════════════════════════════════════════════
        // 🔧 CHANGE THIS URL TO YOUR DEPLOYED APP URL
        // ═══════════════════════════════════════════════
        private const val APP_URL = "https://pu-alrms.vercel.app"
        // ═══════════════════════════════════════════════
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var errorView: LinearLayout
    private lateinit var splashOverlay: FrameLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Status bar color
        window.statusBarColor = ContextCompat.getColor(this, R.color.primary_dark)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        }

        // Initialize views
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        errorView = findViewById(R.id.errorView)
        splashOverlay = findViewById(R.id.splashOverlay)

        // Hide error view initially
        errorView.visibility = View.GONE

        // Setup WebView
        setupWebView()

        // Setup pull-to-refresh
        setupSwipeRefresh()

        // Load the app
        loadApp()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            // Enable JavaScript (required for Next.js app)
            javaScriptEnabled = true

            // Enable DOM storage (required for Zustand/localStorage)
            domStorageEnabled = true

            // Enable file access
            allowFileAccess = true
            allowContentAccess = true

            // Responsive viewport
            useWideViewPort = true
            loadWithOverviewMode = true

            // Enable mixed content (for dev servers)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

            // Cache settings
            cacheMode = WebSettings.LOAD_DEFAULT

            // Enable smooth scrolling
            builtInZoomControls = false
            displayZoomControls = false

            // Text size
            textZoom = 100
        }

        // WebView Client - handles page loading events
        webView.webViewClient = object : WebViewClient() {

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                progressBar.progress = 0
                swipeRefresh.isRefreshing = true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false

                // Hide splash overlay when page is loaded
                if (splashOverlay.visibility == View.VISIBLE) {
                    splashOverlay.animate()
                        .alpha(0f)
                        .setDuration(500)
                        .withEndAction {
                            splashOverlay.visibility = View.GONE
                        }
                        .start()
                }

                // Hide error view if it was showing
                errorView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                // Only show error for main frame
                if (request?.isForMainFrame == true) {
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false
                    showErrorView()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url.toString()

                // Handle external links (open in browser)
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    val appHost = Uri.parse(APP_URL).host
                    val requestHost = Uri.parse(url).host

                    // If different domain, open in external browser
                    if (requestHost != appHost && !requestHost?.contains("firebaseapp.com")!! &&
                        !requestHost.contains("google.com") && !requestHost.contains("googleapis.com") &&
                        !requestHost.contains("gstatic.com") && !requestHost.contains("googleusercontent.com")) {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    }
                }

                // Handle tel:, mailto:, etc.
                if (url.startsWith("tel:") || url.startsWith("mailto:") ||
                    url.startsWith("whatsapp:") || url.startsWith("tg:")) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }

                return false
            }
        }

        // WebChromeClient - handles file uploads, progress, alerts
        webView.webChromeClient = object : WebChromeClient() {

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            // Handle file uploads
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                uploadMessage = filePathCallback
                val intent = fileChooserParams?.createIntent()
                try {
                    startActivityForResult(intent!!, FILE_CHOOSER_RESULT_CODE)
                } catch (e: Exception) {
                    uploadMessage?.onReceiveValue(null)
                    uploadMessage = null
                }
                return true
            }

            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("PU-ALRMS")
                    .setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("PU-ALRMS")
                    .setMessage(message)
                    .setPositiveButton("Yes") { _, _ -> result?.confirm() }
                    .setNegativeButton("No") { _, _ -> result?.cancel() }
                    .show()
                return true
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeResources(
            R.color.primary,
            R.color.primary_dark,
            R.color.accent
        )
        swipeRefresh.setOnRefreshListener {
            if (isNetworkAvailable()) {
                webView.reload()
            } else {
                swipeRefresh.isRefreshing = false
                showErrorView()
            }
        }
    }

    private fun loadApp() {
        if (isNetworkAvailable()) {
            webView.visibility = View.VISIBLE
            errorView.visibility = View.GONE
            webView.loadUrl(APP_URL)
        } else {
            showErrorView()
        }
    }

    private fun showErrorView() {
        webView.visibility = View.GONE
        errorView.visibility = View.VISIBLE

        errorView.findViewById<TextView>(R.id.errorTitle).text = "ইন্টারনেট সংযোগ নেই"
        errorView.findViewById<TextView>(R.id.errorMessage).text =
            "আপনার ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।"
        errorView.findViewById<TextView>(R.id.errorUrl).text = APP_URL

        errorView.findViewById<android.widget.Button>(R.id.retryButton).setOnClickListener {
            if (isNetworkAvailable()) {
                loadApp()
            } else {
                // Show toast
                android.widget.Toast.makeText(
                    this,
                    "এখনো ইন্টারনেট নেই! আবার চেষ্টা করুন।",
                    android.widget.Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager =
            getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetworkInfo
        return network != null && network.isConnected
    }

    // Handle back button - navigate WebView history
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            AlertDialog.Builder(this)
                .setTitle("Exit PU-ALRMS")
                .setMessage("আপনি কি অ্যাপ থেকে বের হতে চান?")
                .setPositiveButton("Yes") { _, _ ->
                    super.onBackPressed()
                }
                .setNegativeButton("No", null)
                .show()
        }
    }

    // Handle file upload results
    private var uploadMessage: ValueCallback<Array<Uri>>? = null

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            uploadMessage?.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            )
            uploadMessage = null
        }
    }

    companion object {
        private const val FILE_CHOOSER_RESULT_CODE = 1001
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
