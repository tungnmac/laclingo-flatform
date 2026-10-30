package laclingo.app;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Màn chờ khởi động (layout/launch_overlay.xml: giới thiệu app + vòng tải) phủ lên WebView trong lúc tải web từ server
 * — thay cho màn trắng. Web gọi LaunchOverlay.hide() khi đã vẽ xong (web: lib/nativeSplash.ts), trang lỗi gọi khi hiện
 * nội dung; quá MAX_SHOW_MS thì tự ẩn. Màn khởi động hệ thống (Android 12+) chỉ hiện icon trong tích tắc trước đó.
 */
@CapacitorPlugin(name = "LaunchOverlay")
public class LaunchOverlay extends Plugin {

    private static final long MAX_SHOW_MS = 10_000;
    private static final long FADE_MS = 200;
    private static View overlay;

    static void show(Activity activity) {
        if (overlay != null) return;
        ViewGroup root = (ViewGroup) activity.getWindow().getDecorView();
        overlay = activity.getLayoutInflater().inflate(R.layout.launch_overlay, root, false);
        root.addView(overlay);
        new Handler(Looper.getMainLooper()).postDelayed(LaunchOverlay::dismiss, MAX_SHOW_MS);
    }

    private static void dismiss() {
        View view = overlay;
        if (view == null) return;
        overlay = null;
        view.animate().alpha(0f).setDuration(FADE_MS).withEndAction(() -> {
            if (view.getParent() instanceof ViewGroup) ((ViewGroup) view.getParent()).removeView(view);
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        getActivity().runOnUiThread(LaunchOverlay::dismiss);
        call.resolve();
    }
}
