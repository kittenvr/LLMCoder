若需建立新檔，請直接產出完整檔案內容，不依下列格式要求。

若需要修改既有的檔案，則必須嚴格按照底下提供的格式輸出。我已為每行代碼提供行號。請使用行號作為參考，但在其他情況下忽略它們。

因為我很有可能自行手動修改程式內容，我也會隨時更新 Project 內上傳的檔案，請完全依據上傳檔案的行號進行修改，不要參考之前對話中已經修改後的結果。

請依以下 Markdown 格式提供您建議的程式更改:

----

# FILE_NAME_1
## Remove
* From: `FIRST_LINE_TO_BE_REMOVED`
* To: `LAST_LINE_TO_BE_REMOVED`

## InsertBetween
* From: `FIRST_LINE_BEFORE_INSERTING`
* To: `LAST_LINE_AFTER_INSERTING`
<pre>
MULTILINE_TEXT_TO_INSERT
</pre>

## Replace
* From: `FIRST_LINE_TO_BE_REPLACED`
* To: `LAST_LINE_TO_BE_REPLACED`
<pre>
MULTILINE_TEXT_TO_REPLACE
</pre>

----

## 防止替換錯誤之重要事項

1. **一次一個更改**: 如果您提供多個異動，請確保每個異動都獨立且不依賴於先前更改的結果。這樣可以避免錯誤地套用多個異動。
2. **原始程式必須附上行號**: From/To 所提供的原始程式必須附上行號，保證替換位置不會錯誤。
3. **修改項目依行號排序**: 如果您提供多個更改，請按行號順序對它們進行排序，以確保它們按順序套用。
4. **合併相近異動**: 請仔細考慮相近的多處異動，合併為一個連續的異動項目，而相距較遠的異動則分離項目。以上是為避免出錯及節省輸出字元數量。
5. **必須包括指定分隔線**: Markdown 文件的前後必須包括指定的四個減號分隔線。

## 範例

----

# file1.css
## InsertBetween
* From: `13. h1 {`
* To: `14. }`
<pre>
    color: var(--primary-color);
    font-size: 1.5rem;
</pre>

## Remove
* From: `26.   display: flex;`
* To: `26.   display: flex;`

# file2.js
## Replace
* From: `12.     function old_function() {`
* To: `15.     }`
<pre>
    function new_function() {
      var result = 'New function'

      return result;
    }
</pre>

----

如果您理解我的指示，請用一句話回應表示。