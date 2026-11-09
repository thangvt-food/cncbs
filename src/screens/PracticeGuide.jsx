import { useEffect, useRef } from 'react';
import { closeDoc } from '../lib/router';
import '../styles/guide.css';

const TOC = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'fresh', label: '1. Kiểm nghiệm sữa tươi' },
  { id: 'yogurt', label: '2.1 Sữa chua lên men' },
  { id: 'cream', label: '2.2 Kem tươi' },
  { id: 'caramel', label: '2.3 Kem caramel (bánh flan)' },
  { id: 'sensory', label: '3. Đánh giá & báo cáo' },
  { id: 'prep', label: '4. Dụng cụ & lưu ý' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="guide__section">
      <h2 className="guide__h2">{title}</h2>
      {children}
    </section>
  );
}

function Sub({ title, children }) {
  return (
    <div className="guide__sub">
      <h3 className="guide__h3">{title}</h3>
      {children}
    </div>
  );
}

function P({ children }) {
  return <p className="guide__p">{children}</p>;
}

function Ul({ children }) {
  return <ul className="guide__list">{children}</ul>;
}

function Li({ children }) {
  return <li className="guide__li">{children}</li>;
}

function Recipe({ items }) {
  return (
    <ul className="guide__recipe">
      {items.map((it, i) => (
        <li key={i} className="guide__recipe-item">
          <span className="guide__recipe-name">{it.name}</span>
          {it.detail ? <span className="guide__recipe-detail">{it.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }) {
  return (
    <ol className="guide__steps">
      {items.map((it, i) => (
        <li key={i} className="guide__step">{it}</li>
      ))}
    </ol>
  );
}

export function PracticeGuide({ pushToast }) {
  const topRef = useRef(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="guide" ref={topRef}>
      <header className="guide__top">
        <button type="button" className="guide__back" onClick={closeDoc} aria-label="Về trang luyện thi">
          ← Về trang luyện thi
        </button>
        <p className="guide__eyebrow">Công nghệ Chế biến Sữa · Mã học phần 210339</p>
        <h1 className="guide__title">Hướng dẫn thực hành ở xưởng</h1>
        <p className="guide__lede">
          Bản ghi lời hướng dẫn của giảng viên: 4 nội dung thực hành ở xưởng (kiểm nghiệm sữa tươi và 3 sản phẩm
          sữa) cùng phần đánh giá cảm quan, báo cáo và chuẩn bị dụng cụ.
        </p>
      </header>

      <nav className="guide__toc" aria-label="Mục lục hướng dẫn">
        {TOC.map((t) => (
          <button key={t.id} type="button" className="guide__toc-btn" onClick={() => scrollTo(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="guide__body">
        <Section id="overview" title="Tổng quan">
          <P>
            Môn thực hành có bốn nội dung thực hiện ở xưởng, kết hợp một phần nội dung ngoài và tổng hợp lý thuyết.
            Nội dung thứ nhất là kiểm nghiệm sữa tươi (đã học ở phòng 104). Ba nội dung còn lại là thực hành ở xưởng
            với ba sản phẩm: sữa chua lên men, kem tươi và kem caramel (bánh flan).
          </P>
          <P>
            Mỗi tổ có 3 thành viên làm việc trên 3 bếp điện. Mỗi sản phẩm có 3 mẫu công thức khác nhau; mỗi tổ chọn
            một mẫu, không trùng nhau. Kết quả được ghi nhận theo tổ và đánh giá cảm quan ở buổi sau.
          </P>
        </Section>

        <Section id="fresh" title="1. Kiểm nghiệm sữa tươi (phòng 104)">
          <P>Đã học ở phòng 104 (Cẩm tú). Nội dung gồm:</P>
          <Ul>
            <Li>Đo pH, chuẩn độ acid.</Li>
            <Li>Thử cồn, thử khả năng đóng tụ.</Li>
            <Li>Kiểm tra sữa có bị nhiễm khuẩn, có bị pha nước hay không.</Li>
            <Li>Tách kem, tách bơ.</Li>
            <Li>Quá trình sấy phun sữa để tạo sữa bột.</Li>
          </Ul>
          <P>
            Mỗi thành viên có số liệu riêng (không ai giống ai); tự mô tả và ghi nhận kết quả, tổng hợp vào file Word
            chung của tổ và thảo luận.
          </P>
        </Section>

        <Section id="yogurt" title="2.1 Sản phẩm 1 — Sữa chua lên men">
          <P>
            Mục đích: quan sát quá trình lên men chuyển hóa lactose sang lactic acid và quá trình sinh hương tạo sản
            phẩm đặc trưng. Ba tổ, mỗi tổ một công thức:
          </P>
          <Recipe
            items={[
              { name: 'Mẫu 1', detail: 'UHT toàn béo — 1 lít' },
              { name: 'Mẫu 2', detail: 'UHT toàn béo 1 lít + 2% sữa bột gầy' },
              { name: 'Mẫu 3', detail: 'UHT toàn béo 1 lít + 150 ml topping cream' },
            ]}
          />
          <P>Tỷ lệ đường: mỗi tổ tự đong, dao động 80–100 g cho mỗi mẫu.</P>
          <Sub title="Lưu ý về nguyên liệu men">
            <P>
              Hiện nay nhà trường không cung cấp sữa thô mới vắt và men khô. Sử dụng sữa chua làm sẵn (đã hoạt hóa
              men) để tiếp tục lên men nhân giống. Không biết mẫu đang ở giai đoạn nào, khả năng lên men khác nhau;
              ghi nhận thực tế, không tổ nào giống tổ nào.
            </P>
          </Sub>
          <Sub title="Quy trình">
            <Steps
              items={[
                'Mỗi tổ nhận 12–15 hũ thủy tinh, rửa sạch, thanh trùng.',
                'Gia nhiệt sữa ở 40–45°C, sau đó hòa đường.',
                'Nếu dùng sữa bột gầy: pha tỷ lệ 2% với 100 ml nước ấm (80–90°C) — lấy nước nóng ở phòng 212 lầu 1 Cẩm tú hoặc đun trực tiếp trên bếp; phối vào dung dịch sữa, đun 2–3 phút.',
                'Mẫu có topping cream: khuấy nhẹ cho hơi bông cấu trúc (không đánh tới khi tách bơ), rồi hòa vào dung dịch sữa.',
                'Cho 1 hộp sữa chua làm sẵn 100 g, trộn đều, rót vào hũ.',
                'Ủ ấm ở 43°C. Cứ sau 2 giờ quan sát mẫu: mở hũ, ngửi hương thơm lactic, kiểm tra đông đặc. Không đo pH/chuẩn độ acid.',
                'Lần cuối cùng sau 4 giờ: lấy mẫu ra, để ngăn mát tủ lạnh (0–5°C). Buổi sau đánh giá cảm quan.',
              ]}
            />
          </Sub>
          <Sub title="Mẫu 3 (có topping cream)">
            <P>
              Sau khi gia nhiệt sữa 40–45°C, nhắc xuống bếp, cho sữa chua vào; đồng thời khuấy nhẹ topping cream cho
              hơi bông rồi hòa vào dung dịch sữa và rót hũ.
            </P>
          </Sub>
        </Section>

        <Section id="cream" title="2.2 Sản phẩm 2 — Kem tươi">
          <P>
            Xưởng không có máy làm kem nên chỉ trộn dung dịch mẫu, để đông; buổi sau lấy ra đánh giá cảm quan và ghi
            nhận. Ba mẫu:
          </P>
          <Recipe
            items={[
              { name: 'Mẫu 1', detail: '400 ml sữa tươi + 300 ml topping cream + 20 g bột bắp + 30 g bột ca cao + 50 g đường' },
              { name: 'Mẫu 2', detail: '400 ml sữa tươi + 300 ml topping cream + 20 g bột bắp + 1 gói cà phê hòa tan + 30 g bột ca cao + 50 g đường' },
              { name: 'Mẫu 3', detail: '300 ml sữa tươi + 500 ml topping cream + 50 g đường + 2 gói cà phê hòa tan + 20 g bột bắp + 30 g bột ca cao' },
            ]}
          />
          <Sub title="Quy trình">
            <Steps
              items={[
                'Bột bắp hòa với 50 g (hoặc 50 ml) nước lạnh (nước nấu chín).',
                'Gia nhiệt sữa đến khi có bọt khí/sôi tim; hòa bột ca cao (hoặc cà phê hòa tan) và đường cho tan trước; nấu 2–3 phút.',
                'Cho bột bắp đã hòa vào; nấu thêm 3–4 phút; tắt bếp.',
                'Khuấy đảo cho hỗn hợp nguội xuống 40–50°C.',
                'Đánh topping nhẹ để tạo cấu trúc xốp, dễ hòa tan (không đánh tới khi tách bơ); trộn toàn bộ hỗn hợp.',
                'Rót vào hũ flan, dán tên, đem qua phòng 105 để ngăn đông (ngăn tay trái).',
              ]}
            />
          </Sub>
          <Sub title="Lưu ý">
            <P>
              Vì không quay kem, cấu trúc không xốp và không tăng thể tích; trong quá trình đông, dầu/hạt nặng lắng
              xuống, hạt nhẹ nổi lên nên bề mặt không phẳng — đây là đặc điểm bình thường của mẫu.
            </P>
          </Sub>
        </Section>

        <Section id="caramel" title="2.3 Sản phẩm 3 — Kem caramel (bánh flan)">
          <P>
            Ba tổ chọn 3 mẫu trong số mẫu 1, 3, 5 (không trùng nhau). Công thức nguyên liệu chung, có thuyết minh cho
            từng mẫu; lưu ý công đoạn thắng caramel.
          </P>
          <Sub title="Thắng caramel">
            <P>
              Đun đường trên bếp đến khi xuất hiện màu cánh gián, mới cho nước và nước chanh vào, khuấy nhẹ. Nấu đến
              khi dung dịch đường hơi sánh thì rót vào khuôn.
            </P>
          </Sub>
          <Sub title="Dung dịch sữa">
            <Steps
              items={[
                'Nước lọc là nước đun sôi để nguội (lấy ở phòng 212 lầu 1 Cẩm tú), không dùng nước vòi trực tiếp.',
                'Hòa trộn sữa/nước ở nhiệt độ 40–50°C, hòa đường cho tan.',
                'Trứng gà (10 quả/tổ): dầm nhẹ lòng đỏ lòng trắng bằng thìa, không đánh bông, không tạo bọt.',
                'Hòa dung dịch sữa và dung dịch trứng; nếu có topping cream thì khuấy nhẹ và hòa vào; cho vani 2–4 ml tạo hương thơm.',
                'Rây qua 2–3 lần để lòng đỏ lòng trắng hòa đều.',
                'Rót mẫu, thanh trùng ở 80–85°C trong 90 phút (cả 3 tổ cùng lúc).',
                'Lấy ra để nguội, sau đó để tủ lạnh; đánh giá cảm quan.',
              ]}
            />
          </Sub>
        </Section>

        <Section id="sensory" title="3. Đánh giá cảm quan & báo cáo">
          <Sub title="Buổi sau">
            <Ul>
              <Li>Tự chuẩn bị nước lọc thanh vị, muỗng cảm quan.</Li>
              <Li>Tự chuẩn bị phiếu đánh giá cảm quan của mỗi tổ.</Li>
              <Li>Mỗi sinh viên có 9 mẫu (3 sản phẩm × 3 mẫu), đánh giá theo màu, mùi, vị, cấu trúc.</Li>
            </Ul>
          </Sub>
          <Sub title="Nội dung báo cáo (5 phần)">
            <ol className="guide__steps">
              <li className="guide__step">
                Báo cáo quá trình kiểm nghiệm sữa tươi (phòng 104): số liệu từng thành viên, tổng hợp Word chung, thảo
                luận của tổ.
              </li>
              <li className="guide__step">Sản phẩm sữa chua: cảm quan theo tổ, xử lý số liệu theo tổ, nhận xét.</li>
              <li className="guide__step">Sản phẩm kem: cảm quan theo tổ, xử lý số liệu theo tổ, nhận xét.</li>
              <li className="guide__step">Sản phẩm kem caramel: cảm quan theo tổ, xử lý số liệu theo tổ, nhận xét.</li>
              <li className="guide__step">Tổng hợp về các sản phẩm sữa hiện nay trên thị trường.</li>
            </ol>
          </Sub>
          <Sub title="Nộp bài">
            <P>
              Có 10 ngày kể từ buổi đánh giá cảm quan cuối. Nộp qua email giảng viên, theo tổ (không nhận bài cá
              nhân). Đặt tên: tổ nào, nhóm nào thực hành sữa. Mỗi tổ làm thành một file/folder.
            </P>
          </Sub>
        </Section>

        <Section id="prep" title="4. Dụng cụ & lưu ý">
          <Ul>
            <Li>Hũ thủy tinh: 12–15 hũ cho sản phẩm sữa chua.</Li>
            <Li>Hũ nhựa: 10–15 hũ cho kem tươi, 20–25 hũ cho kem caramel.</Li>
            <Li>Rửa sạch, thanh trùng trước khi sử dụng.</Li>
            <Li>Phân tổ: xác định tổ số mấy và chọn mẫu cho từng sản phẩm (không trùng mẫu giữa các tổ).</Li>
            <Li>Nước nóng/nước đun sôi để nguội lấy ở phòng 212 lầu 1 Cẩm tú; hoặc đun trực tiếp trên bếp ở xưởng (3 bếp, mỗi tổ một bếp).</Li>
          </Ul>
          <P className="guide__note">
            Nguồn: bản ghi lời hướng dẫn giảng viên (file “script thực hành sữa 9_11_2026.md”). Nội dung chỉ mang
            tính hướng dẫn thực hành, không thay thế giáo trình.
          </P>
        </Section>
      </main>

      <footer className="guide__foot">
        <button type="button" className="guide__back guide__back--foot" onClick={closeDoc}>
          ← Về trang luyện thi
        </button>
      </footer>
    </div>
  );
}