package pe.gob.regionlambayeque.educa;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PdfRenderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
