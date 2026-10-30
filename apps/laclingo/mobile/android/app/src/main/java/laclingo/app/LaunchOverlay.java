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
        ViewGroup root = (ViewGroup) activity.getWindow().getDecorView();
        View view = activity.getLayoutInflater().inflate(R.layout.launch_overlay, root, false);
        root.addView(view);
        overlay = view;
        // Hẹn giờ gắn với đúng màn chờ này — không ẩn nhầm màn chờ của lần mở app sau
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (overlay == view) dismiss();
        }, MAX_SHOW_MS);
    }

    /** Activity bị huỷ khi màn chờ còn hiện (thoát app lúc đang tải) — bỏ tham chiếu tới view của activity cũ */
    static void forget() {
        overlay = null;
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
