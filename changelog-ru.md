#### Link Properties Plus: История изменений

`+` - добавлено<br>
`-` - удалено<br>
`x` - исправлено<br>
`*` - улучшено<br>

##### master/HEAD
`*` Улучшена поддержка Pale Moon (исправлено определение версии, чтобы не применялись устаревшие исправления).<br>
`+` Добавлена поддержка регистронезависимых заголовков (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/26">#26</a>).<br>
`x` Исправлена совместимость с Firefox 56+ (поддержка about:… ссылок, валидация ссылок), <a href="https://forum.mozilla-russia.org/viewtopic.php?pid=742652#p742652">thanks to Dumby</a>.<br>
`x` Исправлены настройки в Firefox 58+ (<em>extensions.legacy.enabled</em> = true) (<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1414096">bug 1414096</a>, <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1413413">bug 1413413</a>).<br>
`*` Подправлено положение пункта меню в Thunderbird 52.<br>
`+` Добавлена поддержка меню «Инструменты разработчика» в Thunderbird 52.<br>
`x` Подправлены префиксы: 1024*1024 теперь конвертируется в 1,00 Мбайт.<br>
`*` В текстовых полях теперь выводятся декодированные ссылки (<em>extensions.linkPropertiesPlus.decodeURIs</em> == true).<br>
`x` Исправлены рамки поля для заголовков в Firefox 60+ (добавлена замена для -moz-border-*-colors).<br>
`x` В Firefox 59+ вместо сломанного окна настроек теперь открывается about:config?filter=extensions.linkPropertiesPlus. (<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1379338">bug 1379338</a>).<br>
`x` Исправлено определение версии Pale Moon 28.1+ и Basilisk.<br>
`*` Улучшено извлечение ссылок: теперь из выделенного текста дополнительно удаляются кавычки «» и “”.<br>
`*` Улучшено определение темной темы (спасибо <a href="https://github.com/bgrins/TinyColor">TinyColor</a>: <a href="https://github.com/bgrins/TinyColor/blob/1.4.1/tinycolor.js#L52">isDark()</a> -> <a href="https://github.com/bgrins/TinyColor/blob/1.4.1/tinycolor.js#L70">getBrightness()</a>).<br>
`x` Исправлена установка HTTP referer'ов с не-ASCII символами.<br>
`*` Добавлено отображение сетевых ошибок наподобие NS_ERROR_UNKNOWN_HOST из nsIRequest.status, если nsIHttpChannel.responseStatus недоступен.<br>

##### 1.6.1 (2017-03-13)
`x` Исправлена совместимость с мультипроцессным режимом (Electrolysis aka e10s) в Firefox 47+ (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/20">#20</a>).<br>
`x` Исправлена совместимость с Firefox 48+ (из-за изменений в nsIIOService, см. <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1254752">bug 1254752</a>).<br>
`x` Исправлена интеграция с окном информации со странице в Firefox 44+ (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/22">#22</a>).<br>
`+` Добавлена китайская (упрощённая) локаль (zh-CN), спасибо <a href="https://github.com/yfdyh000">YFdyh000</a> (<a href="https://github.com/Infocatcher/Link_Properties_Plus/pull/23">#23</a>).<br>
`*` Улучшена производительность при запуске: код для контекстного меню и команд перемещен в отдельный лениво загружаемый файл (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/21">#21</a>).<br>
`x` Исправлена совместимость с будущими версиями Firefox: прекращено использование Array generics вида `Array.forEach()` (<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1222547">bug 1222547</a>).<br>
`+` Добавлено отображение флага перенаправления <a href="https://ru.wikipedia.org/wiki/HSTS">HSTS</a> во всплывающей подсказке для поля «Прямая ссылка».<br>
`*` Обновлена совместимость с расширением <a href="https://addons.mozilla.org/addon/private-tab/">Private Tab</a>: добавлено отслеживание переключения приватности через дублирование вкладки в Firefox 51+ (см. <a href="https://github.com/Infocatcher/Private_Tab/issues/244">Private Tab #244</a>).<br>
`x` Исправлена валидация ссылок в Firefox 37-43 (возникало исключение в `nsIIOService.newChannelFromURIWithLoadInfo(…, null)`).<br>
`x` Исправлено определение диалога открытия файла в Firefox 52+.<br>

##### 1.6.0.1 (2015-12-21)
`x` Исправлено пустое окно свойств при включенном <a href="https://addons.mozilla.org/addon/adblock-plus/">Adblock Plus</a> 2.7 (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/19">#19</a>).<br>

##### 1.6.0 (2015-11-08)
`+` Добавлена поддержка заголовка “X-Archive-Orig-Last-Modified” (используется на <a href="http://archive.org/">archive.org</a>).<br>
`x` Подкорректирована обработка ссылок вида `private:///#http://example.com/` от расширения <a href="https://addons.mozilla.org/addon/private-tab/">Private Tab</a>.<br>
`+` Добавлено отображение возможности докачки (в поле статуса) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/4">#4</a>).<br>
`+` Добавлено сочетание клавиш Ctrl+Shift+C для открытия контекстного меню для текущей строки (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/5">#5</a>).<br>
`+` Все сочетания клавиш теперь настраиваются (настройки <em>extensions.linkPropertiesPlus.key.</em>*) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/6">#6</a>).<br>
`*` Экспериментальное: добавлено блокирование клавиши Escape сразу после завершения запроса, чтобы случайно не закрыть диалог вместо отмены запроса (настройка <em>extensions.linkPropertiesPlus.blockEscapeKeyDelay</em>).<br>
`*` Улучшено поле для заголовков HTTP: теперь используется форматирование и можно сворачивать разделы (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/8">#8</a>, <a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/9">#9</a>).<br>
`*` Изменена иконка расширения (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/10">#10</a>).<br>
`+` Добавлена кнопка для панелей инструментов (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/11">#11</a>).<br>
`*` Улучшено обнаружение ссылок в выделенном тексте: теперь определяет `about:`, но игнорирует `http:`, `http://` и `file:///`.<br>
`+` Добавлена поддержка для отдельного окна сообщений в Thunderbird и почте SeaMonkey (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/12">#12</a>).<br>
`x` Исправлен перевод фокуса на уже открытое окно для получения свойств ссылки с таким же URI и referer'ом, если URI не задан.<br>
`+` Добавлена возможность не использовать мышиный буфера обмена в Linux при заполнении поля для ссылки в окне свойств (настройка <em>extensions.linkPropertiesPlus.preferSelectionClipboard</em>).<br>
`+` Добавлена индикация ошибок при отправке запроса (только в окне свойств ссылки): некорректный URI или ошибка запроса – красная кнопка «Получить свойства», протокол с флагом URI_DOES_NOT_RETURN_DATA или неизвестный протокол – серая кнопка «Получить свойства».<br>
`*` Добавлено отображение изменений в заголовках запроса, сделанных браузером или другими расширениями (скрытая настройка <em>extensions.linkPropertiesPlus.showRequestHeadersDiff</em> для подсветки измененных заголовков) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/13">#13</a>).<br>
`*` Клик средней кнопкой мыши по любому пункту меню (и по кнопке на панели инструментов) автоматически запускает запрос для ссылки из буфера обмена.<br>
`*` Двойной клик по метке “Referer:” (или по пустому полю для ввода referer'а) для получения поддельного referer'а из ссылки.<br>
`*` Теперь ссылки открываются после текущей вкладки только если установлено <em>extensions.linkPropertiesPlus.openInChildTab</em> = true, также добавлена настройка <em>extensions.linkPropertiesPlus.openInChildTab.onlyIfSelected</em> для открытия в соседней вкладке только если вкладка-источник по-прежнему активна.<br>
`x` Подкорректирована локализация чисел и дат (<em>extensions.linkPropertiesPlus.localeNumbers</em> and <em>extensions.linkPropertiesPlus.localeDates</em> preferences) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/15">#15</a>).<br>
`+` Добавлена возможность сохранения развернутого состояния окна свойств.<br>
`+` Окно свойств: добавлено сочетание клавиш для переключения полноэкранного режима (F11).<br>
`*` Реализована возможность перетаскивания ссылки на кнопку, находящуюся внутри кнопки-меню от Australis'а (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/16">#16</a>).<br>
`x` Исправлена обработка about:* ссылок в Firefox 36+.<br>
`*` Улучшена поддержка Electrolysis'а (мультипроцессного режима).<br>
`*` Улучшено обнаружение выделенных текстовых ссылок (настройки: <em>extensions.linkPropertiesPlus.context.onSelection.ignoreSpaces</em>, <em>extensions.linkPropertiesPlus.context.onSelection.detectionThreshold</em>).<br>
`+` Добавлена возможность отправить GET запрос вместо HEAD (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/14">#14</a>).<br>
`*` Двойной клик по метке “Ссылка:” (или по пустому полю для ввода ссылки) для вставки ссылки из буфера обмена.<br>
`x` Исправлена совместимость с будущими версиями Firefox (баг <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1090880">1090880</a>, <a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/18">#18</a>).<br>
`x` Исправлено декодирование ссылок в Firefox 40+.<br>
`x` Исправлено сохранение ссылок с корректным именем файла в Firefox 40+ (как «Сохранить объект как…» из контекстного меню страницы).<br>

##### 1.5.2 (2013-04-06)
`x` Исправлено положение пункта контекстного меню в почтовике SeaMonkey.<br>
`*` Теперь используются платформозависимые разделители строк для копирования многострочного текста в буфер обмена.<br>
`+` Добавлена возможность определения ссылок в текстовых полях (настройка <em>extensions.linkPropertiesPlus.context.onSelection.inInputFields</em>).<br>
`+` Добавлена настройка <em>extensions.linkPropertiesPlus.ownWindow.cropFileNameInTitle</em> для обрезания слишком длинных имен файлов в заголовке окна (или для скрывания имени файла вообще).<br>
`+` Теперь расширение полностью совместимо с пооконным (per-window) приватным режимом (включая поддержку расширения <a href="https://addons.mozilla.org/addon/private-tab/">Private Tab</a>) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/1">#1</a>).<br>
`+` Добавлена всплывающая подсказка со всеми перенаправлениями для поля «Прямая ссылка» (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/2">#2</a>).<br>
`x` Исправлено положение пункта в меню Инструменты в последних версиях Firefox Nightly.<br>
`*` Небольшие оптимизации и улучшения.<br>

##### 1.5.1 (2013-01-07)
`x` Исправлено сохранение ссылок резервным способом в Firefox 20.0a1.<br>
`*` Улучшена обработка HTTP referer'ов:<br>
&emsp;&emsp;* «Внутренние» и file:// ссылки теперь никогда не используются в качестве referer'а (однако вручную по-прежнему можно отправить любой referer).<br>
&emsp;&emsp;* Улучшена обработка встроенной настройки <em>network.http.sendRefererHeader</em>: теперь поле «Referer:» показывает реальное значение (раньше обработка производилась уже «внутри»).<br>
&emsp;&emsp;+ Добавлена настройка <em>extensions.linkPropertiesPlus.useFakeReferer.force</em> для использования поддельного referer'а при отключении отправки referer'ов через <em>network.http.sendRefererHeader</em>.<br>
&emsp;&emsp;+ Добавлена настройка <em>extensions.linkPropertiesPlus.useRealRefererForTextLinks</em> для отправки настоящих referer'ов текстовым ссылкам.<br>
`*` Немного уменьшено время запуска главного окна приложения.<br>
`*` По возможности используется встроенная функция для получения текста из буфера обмена + учитываются изменения из бага <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=463027">"Implement per-window Private Browsing"</a>.<br>
`+` Добавлена возможность получения заголовков в обход кэша: Shift+Enter или Shift+клик/клик средней кнопкой мыши по кнопке «Получить свойства».<br>
`*` Небольшие внутренние улучшения.<br>

##### 1.5.0.2 (2013-01-05)
`*` Расширение больше не упаковывается в <a href="https://developer.mozilla.org/en-US/docs/Extensions/Updating_extensions_for_Firefox_4#XPI_unpacking">дополнительный JAR-архив</a>.<br>
`x` В некоторых случаях кнопка «Применить» в диалоге настроек некорректно оставалась отключенной или включенной.<br>

##### 1.5.0.1 (2013-01-04)
`+` Добавлена французская локаль (fr), спасибо <a href="https://addons.mozilla.org/user/1763345/">Calimero988</a>.<br>

##### 1.5.0 (2013-01-02)
`*` Опубликовано на <a href="https://addons.mozilla.org/">AMO</a>.<br>

##### Старые версии
<a href="http://infocatcher.ucoz.net/ext/fx/ext_link_props/changelog.txt">changelog.txt</a>