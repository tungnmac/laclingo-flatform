package lactrader.app;

import android.os.Bundle;
import android.webkit.WebBackForwardList;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Nút Back Android: lùi về trang trước trong WebView; hết trang → đưa app xuống nền (như nút Home, mở lại
        // không phải nạp lại web). Web không nhúng Capacitor JS nên xử lý ở native.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge().getWebView();
                if (!webView.canGoBack()) {
                    moveTaskToBack(true);
                    return;
                }
                // Trang ngay trước là trang báo mất kết nối (file local, Capacitor tự mở khi nạp web lỗi) → nhảy qua nó
                // về trang web gần nhất; còn lại để WebView tự lùi (goBack bỏ qua đúng các mục lịch sử nó coi là thừa)
                String localUrl = getBridge().getLocalUrl();
                WebBackForwardList history = webView.copyBackForwardList();
                int current = history.getCurrentIndex();
                if (!history.getItemAtIndex(current - 1).getUrl().startsWith(localUrl)) {
                    webView.goBack();
                    return;
                }
                for (int i = current - 2; i >= 0; i--) {
                    if (!history.getItemAtIndex(i).getUrl().startsWith(localUrl)) {
                        webView.goBackOrForward(i - current);
                        return;
                    }
                }
                moveTaskToBack(true);
            }
        });
    }
}
