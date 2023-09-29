<script lang="ts">
    let name = "";
    const handleSubmit = (e: any) => {
      
 
    }

</script>
<div class="body">
    <form on:submit|preventDefault={handleSubmit}>
        <input bind:value={name} placeholder="Your Name"/>
        <button on:click={() => {
            tsvscode.postMessage({ type: 'inputName', value: name });
        }}>Submit</button>
    </form>
</div>
<style>

button {
    margin-top: 5px
}
.body {
    margin-top: 10px;
}
   
</style>