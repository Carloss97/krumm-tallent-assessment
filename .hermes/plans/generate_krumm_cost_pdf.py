from pathlib import Path

out_dir = Path('/mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/Test/.hermes/plans')
tex_path = out_dir / '2026-05-31-krumm-roadmap-costos-internalizados-presentable.tex'


def esc(s):
    s = str(s)
    replacements = {
        '\\': r'\textbackslash{}',
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '–': '--',
        '—': '---',
        '→': r'$\to$',
        '“': '``',
        '”': "''",
        '’': "'",
        '×': r'$\times$',
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    return s


def row(cells):
    return ' & '.join(esc(c) for c in cells) + r' \\'


milestones = [
    {
        'id': 'H1',
        'title': 'Release candidate + staging deploy',
        'objective': 'Pasar de repo local funcional a un staging accesible y verificable.',
        'original': 'USD 2.950--6.010',
        'internal_total': 'USD 1.515--3.150',
        'cash_direct': 'USD 380--1.300',
        'contingency': 'USD 57--325',
        'cash_out': 'USD 437--1.625',
        'internal': [
            ('Ingeniería release/push/CI/config', '12--24 h', 'USD 50/h', 'USD 600--1.200'),
            ('DevOps staging frontend + backend + Postgres', '10--22 h', 'USD 60/h', 'USD 600--1.320'),
            ('QA smoke candidato -> reporte -> backend -> recruiter', '6--12 h', 'USD 30/h', 'USD 180--360'),
            ('PM/release coordination', '3--6 h', 'USD 45/h', 'USD 135--270'),
            ('Subtotal interno absorbido', '', '', 'USD 1.515--3.150'),
        ],
        'cash': [
            ('Staging cloud/DB/storage, 1--2 meses', 'USD 150--500'),
            ('Domain/DNS/email/secrets/tooling', 'USD 50--200'),
            ('Logs/monitoring/backups bootstrap', 'USD 80--250'),
            ('Browser/device QA service opcional', 'USD 100--350'),
            ('Subtotal cash directo', 'USD 380--1.300'),
            ('Contingencia cash 15--25%', 'USD 57--325'),
            ('Cash-out recomendado H1', 'USD 437--1.625'),
        ],
        'comment': 'Con fundador técnico, H1 no debería ser caro en cash. El gasto real es infraestructura y una mínima reserva para pruebas en navegador/dispositivo.',
    },
    {
        'id': 'H2',
        'title': 'Candidate assessment MVP flow',
        'objective': 'Permitir que un candidato externo complete la evaluación sin asistencia.',
        'original': 'USD 5.040--10.040',
        'internal_total': 'USD 3.630--7.300',
        'cash_direct': 'USD 330--1.820',
        'contingency': 'USD 50--455',
        'cash_out': 'USD 380--2.275',
        'internal': [
            ('Ingeniería invitación/auth/consent/session states/persistencia', '45--90 h', 'USD 50/h', 'USD 2.250--4.500'),
            ('UX/copy flujo candidato y cámara denegada', '12--25 h', 'USD 40/h', 'USD 480--1.000'),
            ('QA cross-browser candidato', '18--36 h', 'USD 30/h', 'USD 540--1.080'),
            ('PM scope batería/criterios', '8--16 h', 'USD 45/h', 'USD 360--720'),
            ('Subtotal interno absorbido', '', '', 'USD 3.630--7.300'),
        ],
        'cash': [
            ('Incentivos usability test, 6--12 usuarios', 'USD 180--720'),
            ('Device/browser lab', 'USD 100--400'),
            ('Servicio email/invitación setup', 'USD 50--200'),
            ('Accesibilidad/traducción/copy externo opcional', 'USD 0--500'),
            ('Subtotal cash directo', 'USD 330--1.820'),
            ('Contingencia cash 15--25%', 'USD 50--455'),
            ('Cash-out recomendado H2', 'USD 380--2.275'),
        ],
        'comment': 'Este hito se puede internalizar casi completo. Lo que sí pagaría es testing con usuarios reales o semi-reales, porque los errores de consentimiento, cámara, abandono y sesión aparecen rápido fuera del entorno del equipo.',
    },
    {
        'id': 'H3',
        'title': 'Recruiter portal + reports/export v1',
        'objective': 'Hacer usable el producto para un cliente B2B sin depender del desarrollador.',
        'original': 'USD 6.920--14.040',
        'internal_total': 'USD 4.620--8.830',
        'cash_direct': 'USD 300--2.350',
        'contingency': 'USD 45--588',
        'cash_out': 'USD 345--2.938',
        'internal': [
            ('Full-stack dashboard/reportes/export', '60--110 h', 'USD 50/h', 'USD 3.000--5.500'),
            ('UX/report IA/copy', '18--36 h', 'USD 40/h', 'USD 720--1.440'),
            ('QA dashboard + exports', '18--36 h', 'USD 30/h', 'USD 540--1.080'),
            ('PM/recruiter workflow', '8--18 h', 'USD 45/h', 'USD 360--810'),
            ('Subtotal interno absorbido', '', '', 'USD 4.620--8.830'),
        ],
        'cash': [
            ('PDF/export service/libs', 'USD 0--300'),
            ('Incentivos entrevistas recruiters', 'USD 150--750'),
            ('Browser/device QA lab', 'USD 100--400'),
            ('Assets de diseño/reporte opcional', 'USD 0--700'),
            ('Storage/email/monitoring incremental', 'USD 50--200'),
            ('Subtotal cash directo', 'USD 300--2.350'),
            ('Contingencia cash 15--25%', 'USD 45--588'),
            ('Cash-out recomendado H3', 'USD 345--2.938'),
        ],
        'comment': 'El gasto externo más valioso aquí no es construir UI; es validar con 2--5 recruiters si entienden los límites del reporte, los caveats y qué NO inferir.',
    },
    {
        'id': 'H4',
        'title': 'Privacy/compliance/security hardening',
        'objective': 'Bajar riesgo legal, comercial y técnico antes de candidatos reales.',
        'original': 'USD 7.460--17.810',
        'internal_total': 'USD 2.200--5.040',
        'cash_direct': 'USD 2.410--9.720',
        'contingency': 'USD 362--2.430',
        'cash_out': 'USD 2.772--12.150',
        'internal': [
            ('Ingeniería delete/retention/audit fix', '20--45 h', 'USD 50/h', 'USD 1.000--2.250'),
            ('DevOps backup/restore/secrets/log hardening', '10--24 h', 'USD 60/h', 'USD 600--1.440'),
            ('QA/security regression', '8--18 h', 'USD 30/h', 'USD 240--540'),
            ('PM inventario datos/incident checklist', '8--18 h', 'USD 45/h', 'USD 360--810'),
            ('Subtotal interno absorbido', '', '', 'USD 2.200--5.040'),
        ],
        'cash': [
            ('Legal/privacy counsel', 'USD 1.040--3.120'),
            ('Security review/light pentest', 'USD 1.120--4.200'),
            ('Security tooling/scanners/secret management/backups', 'USD 150--700'),
            ('Privacy docs/DPA/templates/translation', 'USD 100--700'),
            ('Incident/insurance/compliance setup opcional', 'USD 0--1.000'),
            ('Subtotal cash directo', 'USD 2.410--9.720'),
            ('Contingencia cash 15--25%', 'USD 362--2.430'),
            ('Cash-out recomendado H4', 'USD 2.772--12.150'),
        ],
        'comment': 'H4 es el primer hito donde el cash-out no debería comprimirse demasiado. Si hay candidatos reales, legal/privacy y seguridad son parte de la confianza del producto.',
    },
    {
        'id': 'H5',
        'title': 'Pilot instrumentation + baseline calibration',
        'objective': 'Aprender con datos reales sin vender el score como predictor validado.',
        'original': 'USD 8.790--20.680',
        'internal_total': 'USD 3.090--6.980',
        'cash_direct': 'USD 2.110--10.180',
        'contingency': 'USD 316--2.545',
        'cash_out': 'USD 2.426--12.725',
        'internal': [
            ('Ingeniería métricas/export/instrumentación', '35--75 h', 'USD 50/h', 'USD 1.750--3.750'),
            ('Soporte interno data pipeline/notebooks', '10--25 h', 'USD 50/h', 'USD 500--1.250'),
            ('QA integridad datos/missingness/device', '10--24 h', 'USD 30/h', 'USD 300--720'),
            ('PM protocolo piloto/coordinación', '12--28 h', 'USD 45/h', 'USD 540--1.260'),
            ('Subtotal interno absorbido', '', '', 'USD 3.090--6.980'),
        ],
        'cash': [
            ('Consultoría psicometría/data', 'USD 1.200--4.500'),
            ('Incentivos/reclutamiento participantes', 'USD 500--4.000'),
            ('Survey/research tooling', 'USD 50--300'),
            ('Analytics/storage/compute', 'USD 100--600'),
            ('Legal protocol/privacy addendum', 'USD 260--780'),
            ('Subtotal cash directo', 'USD 2.110--10.180'),
            ('Contingencia cash 15--25%', 'USD 316--2.545'),
            ('Cash-out recomendado H5', 'USD 2.426--12.725'),
        ],
        'comment': 'H5 no debería presentarse como validación psicométrica completa. Es baseline inicial, calidad de señal, missingness, diferencias por dispositivo/navegador y documentación honesta de claims permitidos/no permitidos.',
    },
    {
        'id': 'H6',
        'title': 'Pilot launch + customer operations',
        'objective': 'Ejecutar pilotos reales con soporte, feedback y triage.',
        'original': 'USD 5.645--14.440',
        'internal_total': 'USD 3.265--9.570',
        'cash_direct': 'USD 600--4.400',
        'contingency': 'USD 90--1.100',
        'cash_out': 'USD 690--5.500',
        'internal': [
            ('Customer success/recruiter onboarding', '30--90 h', 'USD 45/h', 'USD 1.350--4.050'),
            ('Ingeniería live bugfix/triage', '20--60 h', 'USD 50/h', 'USD 1.000--3.000'),
            ('QA regression/reproducción live', '8--24 h', 'USD 30/h', 'USD 240--720'),
            ('Founder sales/PM feedback loops', '15--40 h', 'USD 45/h', 'USD 675--1.800'),
            ('Subtotal interno absorbido', '', '', 'USD 3.265--9.570'),
        ],
        'cash': [
            ('Helpdesk/CRM/email tooling', 'USD 100--500'),
            ('Soporte/incentivos piloto no cubiertos en H5', 'USD 300--1.500'),
            ('Cloud/monitoring burst durante lanzamiento', 'USD 200--900'),
            ('Materiales cliente/traducción/video rápido', 'USD 0--500'),
            ('Soporte externo emergencia opcional', 'USD 0--1.000'),
            ('Subtotal cash directo', 'USD 600--4.400'),
            ('Contingencia cash 15--25%', 'USD 90--1.100'),
            ('Cash-out recomendado H6', 'USD 690--5.500'),
        ],
        'comment': 'Si H5 ya cubre incentivos de participantes, no duplicar esta partida en H6. Aquí conviene dejar reserva para soporte operativo y bugs en vivo.',
    },
    {
        'id': 'H7',
        'title': 'MVP packaging / private beta comercial',
        'objective': 'Convertir el piloto en una beta privada vendible y explicable.',
        'original': 'USD 5.610--13.880',
        'internal_total': 'USD 2.765--6.440',
        'cash_direct': 'USD 710--5.580',
        'contingency': 'USD 106--1.395',
        'cash_out': 'USD 816--6.975',
        'internal': [
            ('Ingeniería landing/demo/deck polish', '16--36 h', 'USD 50/h', 'USD 800--1.800'),
            ('Founder sales/pricing/copy/deck', '25--60 h', 'USD 45/h', 'USD 1.125--2.700'),
            ('UX/design polish', '15--35 h', 'USD 40/h', 'USD 600--1.400'),
            ('QA release smoke/assets', '8--18 h', 'USD 30/h', 'USD 240--540'),
            ('Subtotal interno absorbido', '', '', 'USD 2.765--6.440'),
        ],
        'cash': [
            ('Diseño/video/editorial externo opcional', 'USD 300--2.500'),
            ('Legal review claims/pricing/deck', 'USD 260--780'),
            ('CRM/analytics/sales tools', 'USD 100--500'),
            ('Stock/templates/domain/email', 'USD 50--300'),
            ('Paid outreach/ad tests opcional', 'USD 0--1.500'),
            ('Subtotal cash directo', 'USD 710--5.580'),
            ('Contingencia cash 15--25%', 'USD 106--1.395'),
            ('Cash-out recomendado H7', 'USD 816--6.975'),
        ],
        'comment': 'H7 puede ser barato si el equipo fundador hace deck, pricing, landing y demo. El gasto externo sólo se justifica si se quiere acelerar calidad visual/video o paid outreach.',
    },
]

summary_rows = [
    ('Presupuesto original del roadmap 05-28, con contingencia', 'USD 48.777--121.125'),
    ('Cash-out directo externo revisado, antes de contingencia', 'USD 6.840--35.350'),
    ('Contingencia cash recomendada', 'USD 1.026--8.838'),
    ('Cash-out recomendado con equipo interno absorbido', 'USD 7.866--44.188'),
    ('Costo de oportunidad interno valorizado, no cash', 'USD 21.085--47.310'),
    ('Costo económico total revisado, cash + oportunidad interna', 'USD 28.951--91.498'),
]

ops_rows = [
    ('Hosting, DB, storage', 'USD 80--350'),
    ('Logs/monitoring', 'USD 40--150'),
    ('Email, dominio, herramientas menores', 'USD 30--100'),
    ('API IA/fallback si se usa', 'USD 50--500'),
    ('Backups/seguridad/herramientas', 'USD 50--250'),
    ('Subtotal infra/herramientas', 'USD 250--1.350'),
    ('Reserva soporte/incentivos operativos si aplica', 'USD 100--750'),
    ('Total mensual recomendado', 'USD 350--2.100'),
]

tex_parts = []
tex_parts.append(r'''
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[spanish,es-nodecimaldot]{babel}
\usepackage{lmodern}
\usepackage{microtype}
\usepackage[a4paper,margin=1.75cm,headheight=18pt,includeheadfoot]{geometry}
\usepackage[table]{xcolor}
\usepackage{array,tabularx,longtable,booktabs,makecell,multirow,adjustbox,pdflscape,graphicx}
\usepackage{enumitem}
\usepackage{fancyhdr}
\usepackage{lastpage}
\usepackage{hyperref}
\definecolor{KDark}{HTML}{111827}
\definecolor{KMuted}{HTML}{4B5563}
\definecolor{KLine}{HTML}{D1D5DB}
\definecolor{KAccent}{HTML}{A3E635}
\definecolor{KAccentDark}{HTML}{365314}
\definecolor{KSoft}{HTML}{F3F4F6}
\definecolor{KBlue}{HTML}{E0F2FE}
\definecolor{KBlueDark}{HTML}{075985}
\definecolor{KWarn}{HTML}{FEF3C7}
\definecolor{KWarnDark}{HTML}{92400E}
\hypersetup{colorlinks=true, linkcolor=KBlueDark, urlcolor=KBlueDark, pdftitle={KRUMM Roadmap - Costos internalizados}, pdfauthor={KRUMM / Hermes Agent}}
\pagestyle{fancy}
\fancyhf{}
\lhead{\textcolor{KMuted}{KRUMM Talent Assessment}}
\rhead{\textcolor{KMuted}{Roadmap de costos}}
\cfoot{\textcolor{KMuted}{\thepage\ de \pageref{LastPage}}}
\renewcommand{\headrulewidth}{0.3pt}
\renewcommand{\arraystretch}{1.22}
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}
\setlist[itemize]{leftmargin=1.2em,itemsep=2pt,topsep=2pt}
\setlist[enumerate]{leftmargin=1.5em,itemsep=2pt,topsep=2pt}
\newcolumntype{Y}{>{\raggedleft\arraybackslash}X}
\newcolumntype{L}{>{\raggedright\arraybackslash}X}
\newcommand{\sectionbar}[1]{\vspace{0.6em}\noindent\colorbox{KDark}{\parbox{\dimexpr\linewidth-2\fboxsep}{\textcolor{white}{\Large\bfseries #1}}}\vspace{0.5em}}
\newcommand{\subsectionbar}[1]{\vspace{0.3em}\noindent{\large\bfseries\textcolor{KAccentDark}{#1}}\par\vspace{0.1em}}
\newcommand{\callout}[2]{\noindent\fcolorbox{#1}{#1!8}{\parbox{\dimexpr\linewidth-2\fboxsep-2\fboxrule}{#2}}}
\newcommand{\pill}[2]{\colorbox{#1}{\strut\hspace{0.4em}\textcolor{white}{\small\bfseries #2}\hspace{0.4em}}}
''')

tex_parts.append(r'''
\begin{document}
\begin{titlepage}
\thispagestyle{empty}
\vspace*{0.6cm}
\begin{minipage}{0.62\linewidth}
{\Huge\bfseries\textcolor{KDark}{KRUMM Talent Assessment}}\\[0.35cm]
{\LARGE\bfseries Revisión de costos del roadmap 2026-05-28}\\[0.2cm]
{\Large con equipo fundador/interno absorbido}
\end{minipage}
\hfill
\begin{minipage}{0.28\linewidth}\raggedleft
\IfFileExists{/mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/Test/dist/logo.jpg}{\includegraphics[width=0.95\linewidth]{/mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/Test/dist/logo.jpg}}{\Huge\bfseries KRUMM}
\end{minipage}

\vspace{1.0cm}
\noindent\colorbox{KDark}{\parbox{\dimexpr\linewidth-2\fboxsep}{\textcolor{white}{\large Documento financiero de planificación para MVP piloto / private beta}}}

\vspace{0.8cm}
\begin{tabularx}{\linewidth}{@{}>{\bfseries\color{KMuted}}l X@{}}
Fecha de revisión: & 2026-05-31 \\
Roadmap base: & 2026-05-28 — recap, roadmap a MVP y presupuesto aproximado \\
Proyecto: & /mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/Test \\
Supuesto clave: & el trabajo del equipo fundador/interno se absorbe como no-cash; se mantiene visible como costo de oportunidad. \\
\end{tabularx}

\vfill
\callout{KWarn}{\textbf{Nota de lectura.} Este documento separa desembolso cash de costo económico total. El cash-out baja mucho cuando el equipo fundador ejecuta internamente, pero no desaparecen legal/privacy, seguridad, baseline/data, piloto, infraestructura ni operación.}
\end{titlepage}

\tableofcontents
\clearpage
''')

tex_parts.append(r'''
\section{Lectura ejecutiva}
El roadmap del 2026-05-28 estaba bien estructurado, pero el presupuesto mezclaba dos conceptos diferentes: costo económico total si casi todo se pagara como trabajo profesional externo o imputado, y cash-out real necesario si el equipo fundador/interno absorbe ingeniería, PM, producto, parte de UX/copy, QA operativa y soporte inicial.

Bajo el supuesto pedido, el presupuesto deja de ser principalmente un presupuesto de desarrollo y pasa a ser un presupuesto de gastos externos inevitables o recomendables: infraestructura, legal/privacy, seguridad/pentest ligero, consultoría psicométrica/data, incentivos/reclutamiento de piloto, browser/device testing y materiales comerciales externos opcionales.

\callout{KBlue}{\textbf{Conclusión principal.} El presupuesto original de \textbf{USD 48.777--121.125} era razonable como costo total profesionalizado. Si el equipo fundador absorbe trabajo interno, el cash-out recomendado para completar H1--H7 baja a \textbf{USD 7.866--44.188}, más \textbf{USD 350--2.100/mes} de operación.}

\section{Supuestos usados}
\subsection{Interno absorbido como no-cash}
Se asume como costo no desembolsado: ingeniería frontend/backend, DevOps básico si lo hace el equipo técnico fundador, PM/product ownership, coordinación de release, soporte inicial de clientes, copy/UX básico y QA manual básica.

Esto no significa que sea gratis: se separa como costo de oportunidad interno porque consume capacidad del equipo.

\subsection{Cash-out externo que no conviene eliminar}
Se conserva como desembolso: legal/privacy review, seguridad externa ligera antes de candidatos reales, consultoría data/psicometría para baseline/calibración inicial, cloud/DB/storage/monitoring/backups/email, incentivos/reclutamiento/operación de piloto, QA cross-device cuando haga falta y diseño/video/comercial externo sólo si el equipo no lo absorbe.

\subsection{Tarifas de referencia para valorizar oportunidad interna}
\begin{tabularx}{\linewidth}{@{}L Y L Y@{}}
\toprule
\rowcolor{KSoft}\textbf{Rol} & \textbf{Tarifa} & \textbf{Rol} & \textbf{Tarifa} \\
\midrule
Ingeniería & USD 50/h & DevOps & USD 60/h \\
UX/product design & USD 40/h & QA & USD 30/h \\
Data/psicometría & USD 100/h & Legal/privacy & USD 130/h \\
Seguridad & USD 140/h & PM/customer success & USD 45/h \\
Marketing/sales collateral & USD 50/h & & \\
\bottomrule
\end{tabularx}

\section{Totales revisados}
\begin{tabularx}{\linewidth}{@{}L Y@{}}
\toprule
\rowcolor{KDark}\textcolor{white}{\textbf{Concepto}} & \textcolor{white}{\textbf{Rango}} \\
\midrule
''')
for c, r in summary_rows:
    tex_parts.append(row([c, r]) + '\n')
tex_parts.append(r'''
\bottomrule
\end{tabularx}

\subsection{Lectura práctica por alcance}
\begin{itemize}
  \item \textbf{H1--H3:} staging + flujo candidato + recruiter básico: \textbf{USD 1.162--6.838 cash}. Sirve para demo/staging serio, no necesariamente candidatos reales.
  \item \textbf{H1--H4:} incluye privacidad/compliance/seguridad mínima: \textbf{USD 3.934--18.988 cash}. Más defendible para candidatos reales.
  \item \textbf{H1--H5:} piloto instrumentado con baseline inicial: \textbf{USD 6.360--31.713 cash}. Recomendado antes de venta fuerte.
  \item \textbf{H1--H7:} MVP/private beta completo: \textbf{USD 7.866--44.188 cash}. La variación depende de cuánto se tercerice en seguridad, legal, diseño, reclutamiento e incentivos.
\end{itemize}
''')

tex_parts.append(r'''
\clearpage
\begin{landscape}
\section{Resumen por hito}
\small
\begin{longtable}{@{}p{5.2cm}p{3.2cm}p{3.4cm}p{3.2cm}p{3.0cm}p{3.3cm}@{}}
\toprule
\rowcolor{KDark}\textcolor{white}{\textbf{Hito}} & \textcolor{white}{\textbf{Original 05-28}} & \textcolor{white}{\textbf{Oportunidad interna absorbida}} & \textcolor{white}{\textbf{Cash directo externo}} & \textcolor{white}{\textbf{Contingencia cash}} & \textcolor{white}{\textbf{Cash-out recomendado}} \\
\midrule
\endfirsthead
\toprule
\rowcolor{KDark}\textcolor{white}{\textbf{Hito}} & \textcolor{white}{\textbf{Original 05-28}} & \textcolor{white}{\textbf{Oportunidad interna absorbida}} & \textcolor{white}{\textbf{Cash directo externo}} & \textcolor{white}{\textbf{Contingencia cash}} & \textcolor{white}{\textbf{Cash-out recomendado}} \\
\midrule
\endhead
''')
for m in milestones:
    tex_parts.append(row([f"{m['id']} {m['title']}", m['original'], m['internal_total'], m['cash_direct'], m['contingency'], m['cash_out']]) + '\n')
tex_parts.append(row(['Total', 'USD 42.415--96.900 antes de contingencia', 'USD 21.085--47.310', 'USD 6.840--35.350', 'USD 1.026--8.838', 'USD 7.866--44.188']) + '\n')
tex_parts.append(r'''
\bottomrule
\end{longtable}
\normalsize
\end{landscape}
\clearpage
''')

tex_parts.append(r'''
\section{Desglose detallado por hito}
''')

for m in milestones:
    tex_parts.append(f"\\subsection{{{esc(m['id'] + ' — ' + m['title'])}}}\n")
    tex_parts.append(f"\\textbf{{Objetivo:}} {esc(m['objective'])}\n\n")
    tex_parts.append(r'''
\subsectionbar{Esfuerzo interno absorbido}
\begin{tabularx}{\linewidth}{@{}L>{\raggedleft\arraybackslash}p{2.0cm}>{\raggedleft\arraybackslash}p{2.3cm}>{\raggedleft\arraybackslash}p{3.2cm}@{}}
\toprule
\rowcolor{KSoft}\textbf{Partida interna} & \textbf{Horas} & \textbf{Tarifa ref.} & \textbf{Valor oportunidad} \\
\midrule
''')
    for item in m['internal']:
        tex_parts.append(row(item) + '\n')
    tex_parts.append(r'''
\bottomrule
\end{tabularx}
''')
    tex_parts.append(r'''
\subsectionbar{Cash-out externo}
\begin{tabularx}{\linewidth}{@{}L>{\raggedleft\arraybackslash}p{4.0cm}@{}}
\toprule
\rowcolor{KSoft}\textbf{Partida cash} & \textbf{Rango} \\
\midrule
''')
    for item in m['cash']:
        tex_parts.append(row(item) + '\n')
    tex_parts.append(r'''
\bottomrule
\end{tabularx}
''')
    tex_parts.append(f"\\callout{{KBlue}}{{\\textbf{{Comentario.}} {esc(m['comment'])}}}\n\n")

tex_parts.append(r'''
\clearpage
\section{Operación mensual revisada}
El roadmap base estimaba USD 500--2.350/mes. Con soporte fundador absorbido, conviene separar infraestructura/herramientas de reserva operativa.

\begin{tabularx}{\linewidth}{@{}L Y@{}}
\toprule
\rowcolor{KDark}\textcolor{white}{\textbf{Categoría mensual}} & \textcolor{white}{\textbf{Rango cash}} \\
\midrule
''')
for item in ops_rows:
    tex_parts.append(row(item) + '\n')
tex_parts.append(r'''
\bottomrule
\end{tabularx}

Si el piloto todavía no tiene candidatos reales, se puede operar cerca del tramo bajo. Con 50--200 candidatos, clientes externos y soporte activo, conviene presupuestar el tramo medio/alto.

\section{Recomendación de uso del presupuesto}
\subsection{Demo/staging serio, no piloto con candidatos reales}
\begin{itemize}
  \item Priorizar H1--H3.
  \item Cash-out aproximado: \textbf{USD 1.162--6.838}.
  \item Riesgo: todavía no es recomendable abrirlo ampliamente a candidatos reales sin H4.
\end{itemize}

\subsection{Piloto real con candidatos}
\begin{itemize}
  \item Priorizar H1--H5 antes de venta fuerte.
  \item Cash-out aproximado: \textbf{USD 6.360--31.713}.
  \item No recortar legal/security/data baseline.
  \item Mantener lenguaje: baseline inicial, support for human review, no decisión automática.
\end{itemize}

\subsection{Private beta comercial vendible}
\begin{itemize}
  \item Completar H1--H7.
  \item Cash-out aproximado: \textbf{USD 7.866--44.188}.
  \item La diferencia entre tramo bajo y alto depende de cuánto se tercerice en seguridad, legal, diseño/video, reclutamiento e incentivos.
\end{itemize}

\section{Partidas a recortar vs. roadmap original}
\begin{itemize}
  \item Desarrollo externo general: absorbido por founders/internal.
  \item PM externo: absorbido.
  \item UX/copy básico: absorbido salvo validación puntual.
  \item QA manual básica: absorbida salvo browser/device lab.
  \item Comercial/deck/one-pager: absorbido salvo diseño/video profesional.
\end{itemize}

\section{Partidas que no conviene recortar para candidatos reales}
\begin{itemize}
  \item Legal/privacy review.
  \item Security review ligera.
  \item Retención/eliminación/backup/restore.
  \item Baseline/calibración inicial con apoyo data/psicométrico.
  \item Incentivos/reclutamiento para feedback real.
  \item Monitoring/logs/backups.
  \item QA mínima en navegadores/dispositivos.
\end{itemize}

\section{Conclusión}
La lectura revisada es:
\begin{itemize}
  \item El presupuesto original de \textbf{USD 48.777--121.125} era razonable como costo total profesionalizado.
  \item Si el equipo fundador absorbe trabajo interno, el cash-out real para llegar a MVP piloto baja a \textbf{USD 7.866--44.188}, más \textbf{USD 350--2.100/mes} de operación.
  \item El tramo bajo sólo es defendible si el equipo hace casi todo y el piloto es muy controlado.
  \item Para candidatos reales y clientes B2B, el presupuesto sano está más cerca de \textbf{USD 15k--35k cash} antes de intentar venderlo como beta privada, porque legal, seguridad, baseline y operación no deberían improvisarse.
\end{itemize}

\end{document}
''')

tex = ''.join(tex_parts)
tex_path.write_text(tex, encoding='utf-8')
print(tex_path)
