package laclingo.app;

import android.os.Bundle;
import android.webkit.WebBackForwardList;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaunchOverlay.class);
        super.onCreate(savedInstanceState);
        // Mở app (không phải tạo lại activity): hiện màn chờ giới thiệu + vòng tải tới khi web vẽ xong
        if (savedInstanceState == null) LaunchOverlay.show(this);
        // Nút Back Android: lùi về trang trước trong WebView; hết trang → đưa app xuống nền (như nút Home, mở lại
        // không phải nạp lại web). Plugin App tắt bộ xử lý nút Back (capacitor.config.ts) nên xử lý ở native.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge().getWebView();
                if (!webView.canGoBack()) {
                    moveTaskToBack(true);
                    return;
                }
                // Trang ngay trước là trang báo mất kết nối (Capacitor tự mở khi nạp web lỗi) → nhảy qua nó về trang web
                // gần nhất; còn lại để WebView tự lùi (goBack bỏ qua đúng các mục lịch sử nó coi là thừa)
                WebBackForwardList history = webView.copyBackForwardList();
                int current = history.getCurrentIndex();
                if (!isErrorPage(history.getItemAtIndex(current - 1).getUrl())) {
                    webView.goBack();
                    return;
                }
                for (int i = current - 2; i >= 0; i--) {
                    if (!isErrorPage(history.getItemAtIndex(i).getUrl())) {
                        webView.goBackOrForward(i - current);
                        return;
                    }
                }
                moveTaskToBack(true);
            }
        });
    }

    /**
     * Trang lỗi là file local Capacitor phục vụ ở host cục bộ (vd https://localhost/index.html — server.hostname +
     * errorPath), KHÔNG cùng host với web; so khớp đúng URL đó vì getLocalUrl() khi có server.url lại là origin của web
     */
    private boolean isErrorPage(String url) {
        String errorUrl = getBridge().getErrorUrl();
        return errorUrl != null && url != null && url.split("[?#]", 2)[0].equals(errorUrl);
    }
}
